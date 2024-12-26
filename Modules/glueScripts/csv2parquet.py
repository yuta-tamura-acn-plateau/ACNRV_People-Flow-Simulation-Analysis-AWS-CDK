from operator import imod
import sys
import os
import boto3
import pandas as pd
import io
import time
import tempfile

from awsglue.utils import getResolvedOptions

from awsglue.transforms import *
from pyspark.context import SparkContext
from pyspark.sql.functions import lit
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame

s3 = boto3.resource('s3')
s3_client = boto3.client('s3')

# 読み込むcsvの情報 (プレフィックス名, ファイル名, テーブル名)
read_file_info = (
    ('mesh-info','MeshInfo','mesh_info'),
    ('collision-optimizer', 'CollisionOptimizer','collision_optimizer'),
    ('character-move-log','CharacterMoveLog','character_move_log'),
    ('character-start-log','CharacterStartLog','character_start_log'),
    ('character-end-log','CharacterEndLog','character_end_log'),
    ('character-info-log','CharacterInfoLog','character_info_log'),
    ('goal-density-info','GoalDensityInfo','goal_density_info'),
)

# outputバケットとinputバケットを比較してoutputバケットに存在しないファイルのキーをコピー対象として編集する。
# また、コピー対象のファイルが存在するディレクトリ名（パーティションキー）を配列に編集する。
def diff_bucket(prefix_str):
    output_prefix_list = list()
    for obj_output in s3.Bucket(output_bucket_name).objects.filter(Prefix=prefix_str):
        key_split = obj_output.key.split('/')
        if len(key_split) == 3 and (key_split[1]) :
            # outputバケットが既に持っているものを追加していく
            output_prefix_list.append('{}/{}'.format(key_split[0], key_split[1]))

    for obj_input in s3.Bucket(input_bucket_name).objects.filter(Prefix=prefix_str):
        key_split = obj_input.key.split('/')
        if len(key_split) == 3 and (key_split[1]):
            # output_prefix_listにある場合はdiff_prefix_list追加はスキップ
            input_prefix = '{}/{}'.format(key_split[0], key_split[1])
            if (input_prefix) not in output_prefix_list:
                diff_prefix_dic.setdefault(read_target[0], []).append(input_prefix)
                # コピー対象のファイルが存在するディレクトリ名（パーティションキー）を保存する
                partition = key_split[1]
                if partition not in target_partitions:
                    target_partitions.append(partition)

# オプションパラメータを取得する。
glue_client = boto3.client("glue", region_name='ap-northeast-1')
options = ['JOB_NAME', 'INPUT_BUCKET', 'OUTPUT_BUCKET', 'DATABASE']
if ("--WORKFLOW_NAME" in sys.argv):
    options.append('WORKFLOW_NAME')
if ("--WORKFLOW_RUN_ID" in sys.argv):
    options.append('WORKFLOW_RUN_ID')
args = getResolvedOptions(sys.argv, options)
job_run_id = args.get('JOB_RUN_ID')
job_name = args.get('JOB_NAME')
workflow_name = args.get('WORKFLOW_NAME')
workflow_run_id = args.get('WORKFLOW_RUN_ID')
input_bucket_name = args.get('INPUT_BUCKET')
output_bucket_name = args.get('OUTPUT_BUCKET')
database_name = args.get('DATABASE')
print('database_name: {}'.format(database_name))
print('job_run_id: {}'.format(job_run_id))
print('JOB_NAME: {}'.format(job_name))
print('WORKFLOW_NAME: {}'.format(workflow_name))
print('WORKFLOW_RUN_ID: {}'.format(workflow_run_id))
workflow_params_targets = ''
if (workflow_name) and (workflow_run_id):
    # ワークフローのプロパティから分析ターゲットパラメータを取得する。
    workflow_params = glue_client.get_workflow_run_properties(Name=workflow_name, RunId=workflow_run_id)["RunProperties"]
    workflow_params_targets = workflow_params.get('Target')
if not ((input_bucket_name) and (output_bucket_name)):
    raise Exception('バケット名が指定されていません。')

# ジョブ初期化
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(job_name, args)

# インプットバケットとアウトプットバケットのdiffをとる
diff_prefix_dic = {}    # Key = S3Prefix, Value =　Array of input file
target_partitions = list()
for read_target in read_file_info:
    if (workflow_params_targets):
        for t in workflow_params_targets.split(','):
            prefix_str = '{}/dt={}/'.format(read_target[0], t)
            diff_bucket(prefix_str)
    else:
        prefix_str = '{}/dt='.format(read_target[0])
        diff_bucket(prefix_str)

# diffファイルを転送
for read_file in read_file_info:
    not_exist_files = diff_prefix_dic.get(read_file[0], [])
    print(not_exist_files)
    for input_file_name in not_exist_files:
        # S3からcsvデータをdynamic_frameとして取得
        s3Path = 's3://{}/{}'.format(input_bucket_name, input_file_name)
        dyf = glueContext.create_dynamic_frame.from_options(
            connection_type = 's3',
            connection_options = {'paths': [s3Path]},
            format='csv',
            format_options={'separator': ',', 'withHeader': True}
        )

        partitionKey = input_file_name.split('/')[1].split('=')[0]
        partitionVal = input_file_name.split('/')[1].split('=')[1]

        # dynamic_frame（csvから取得したデータ）にパーティション列を追加
        add_partition_df = dyf.toDF().withColumn(partitionKey, lit(partitionVal))
        add_partition_dyf = DynamicFrame.fromDF(add_partition_df, glueContext, 'add_partition_dyf')

        # glue data catalogのテーブル情報からカラム、パーティションキー名とデータ型を取得
        table_info = glue_client.get_table(DatabaseName = database_name, Name = read_file[2])
        columns = table_info['Table']['StorageDescriptor']['Columns']
        partition_keys = table_info['Table']['PartitionKeys']

        # dynamic_frame（csvから取得したデータ）の全ての列のデータをテーブル定義のデータ型に変換
        # ※csvから取得したdynamic_frameのデータ型は全てstringになっているので、string→テーブル定義のデータ型となるようにmapping
        mappings = list()
        for col in columns:
            mapping = (col['Name'], 'string', col['Name'], col['Type'])
            # print(mapping)
            mappings.append(mapping)

        for pk in partition_keys:
            mapping = (pk['Name'], 'string', pk['Name'], pk['Type'])
            # print(mapping)
            mappings.append(mapping)

        apply_mapping_dyf = ApplyMapping.apply(
            frame = add_partition_dyf, 
            mappings = mappings, 
            transformation_ctx = 'apply_mapping'
        )
        # apply_mapping_dyf.toDF().show()

        # データが1件も無い場合もディレクトリだけは作成
        if (apply_mapping_dyf.count() == 0):
            s3_client.put_object(Bucket=output_bucket_name, Key=input_file_name + '/')

        output_dir = 's3://{}/{}/'.format(output_bucket_name, input_file_name.split('/')[0])
        # dynamic_frameをs3にparquetとしてアウトプットのみ
        # sink = glueContext.write_dynamic_frame.from_options(frame = apply_mapping_dyf, connection_type = 's3', connection_options = {'path': output_dir}, format = 'parquet', transformation_ctx = 'sink')

        # dynamic_frameをs3にparquetとしてアウトプット、パーティションを追加
        sink = glueContext.getSink(
            connection_type='s3', 
            path=output_dir,
            enableUpdateCatalog=True,
            partitionKeys=list(map(lambda x: x['Name'], partition_keys))
        )
        sink.setFormat('glueparquet')
        sink.setCatalogInfo(catalogDatabase=database_name, catalogTableName=read_file[2])
        sink.writeFrame(apply_mapping_dyf)

if (workflow_name) and (workflow_run_id):
    # targetが未設定の場合、変換処理を行なったパーティションをTargetとして渡す。
    if not (workflow_params_targets):
        workflow_params['Target'] = ",".join(target_partitions)
    # 後続のワークフロー/ジョブにパラメータを引き渡すため、プロパティをセットする。
    print('Target: {}'.format(workflow_params['Target']))
    glue_client.put_workflow_run_properties(Name=workflow_name, RunId=workflow_run_id, RunProperties=workflow_params)
