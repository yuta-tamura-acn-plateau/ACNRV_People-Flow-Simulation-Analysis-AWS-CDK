import { Stack, aws_s3, aws_ssm } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  PLATEAU_ENV,
  SSM_PARAM_S3_3D_MODEL_BUCKET_NAME,
  SSM_PARAM_S3_ANALYZE_CSV_LOG_BUCKET_NAME,
  SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME,
  SSM_PARAM_S3_GLUE_SCRIPTS_BUCKET_NAME,
  SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME,
  SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME,
  SSM_PARAM_S3_REPLAY_BUCKET_NAME,
} from "./constants";

export class PFSS3Stack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      description: `PeopleFlowSim S3 Stack (${PLATEAU_ENV})`,
    });

    // 分析のインプットとなるCSVログファイル格納用バケット
    const analyzeCsvLogBucket = new aws_s3.Bucket(this, "AnalyzeCsvLogBucket");

    // CSVからparquetに変換したログファイル格納用バケット
    const analyzeParquetLogBucket = new aws_s3.Bucket(this, "AnalyzeParquetLogBucket");

    // メッシュ密度計算結果格納用バケット
    const meshDensityInfoBucket = new aws_s3.Bucket(this, "MeshDensityInfoBucket");

    // Glueジョブスクリプト用バケット
    const glueScriptsBucket = new aws_s3.Bucket(this, "GlueScriptsBucket");

    // Glue Work用バケット
    const glueWorkBucket = new aws_s3.Bucket(this, "GlueWorkBucket");

    // リプレイファイル用バケット
    const replayBucket = new aws_s3.Bucket(this, "ReplayBucket");

    // バケットネーム を SSM Parameter Store に出力する。
    new aws_ssm.StringParameter(this, "StringParameter3DModelBucket", {
      parameterName: SSM_PARAM_S3_3D_MODEL_BUCKET_NAME,
      stringValue: "3d-city-model",
    });
    new aws_ssm.StringParameter(this, "StringParameterAnalyzeCsvLogBucket", {
      parameterName: SSM_PARAM_S3_ANALYZE_CSV_LOG_BUCKET_NAME,
      stringValue: analyzeCsvLogBucket.bucketName,
    });
    new aws_ssm.StringParameter(this, "StringParameterAnalyzeParquetLogBucket", {
      parameterName: SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME,
      stringValue: analyzeParquetLogBucket.bucketName,
    });
    new aws_ssm.StringParameter(this, "StringParameterMeshDensityInfoBucket", {
      parameterName: SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME,
      stringValue: meshDensityInfoBucket.bucketName,
    });
    new aws_ssm.StringParameter(this, "StringParameterGlueScriptsBucket", {
      parameterName: SSM_PARAM_S3_GLUE_SCRIPTS_BUCKET_NAME,
      stringValue: glueScriptsBucket.bucketName,
    });
    new aws_ssm.StringParameter(this, "StringParameterGlueWorkBucket", {
      parameterName: SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME,
      stringValue: glueWorkBucket.bucketName,
    });
    new aws_ssm.StringParameter(this, "StringParameterReplayBucket", {
      parameterName: SSM_PARAM_S3_REPLAY_BUCKET_NAME,
      stringValue: replayBucket.bucketName,
    });
  }
}
