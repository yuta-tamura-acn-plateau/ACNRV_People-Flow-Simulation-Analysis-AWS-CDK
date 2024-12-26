import { aws_ssm, aws_glue, Aws, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  GLUE_DATABASE_NAME,
  PLATEAU_ENV,
  SSM_PARAM_GLUE_DATABASE_NAME,
  SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME,
  SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME,
} from "./constants";
export interface PFSGlueDbStackProps {
  customParams: any;
}
export class PFSGlueDbStack extends Stack {
  constructor(scope: Construct, id: string, props: PFSGlueDbStackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      description: `PeopleFlowSim Glue Database Stack (${PLATEAU_ENV})`,
    });

    const { customParams } = props;

    // customParamsがある場合にリソース作成
    if (Object.keys(customParams).length !== 0) {
      // ***********************************
      // Glueデータベース作成
      // ***********************************
      const glueDatabase = new aws_glue.CfnDatabase(this, "AnalyzeGlueDatabase", {
        catalogId: Aws.ACCOUNT_ID,
        databaseInput: {
          name: GLUE_DATABASE_NAME,
          description: "シミュレーション分析用データベース",
        },
      });

      // ***********************************
      // Glueテーブル作成
      // ***********************************
      const analyzeParquetLogBucketName = aws_ssm.StringParameter.valueFromLookup(
        this,
        SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME
      );
      const meshDensityInfoBucketName = aws_ssm.StringParameter.valueFromLookup(
        this,
        SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME
      );

      const meshInfoTable = new aws_glue.CfnTable(this, "MeshInfoTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/mesh-info/`,
            ...customParams.MESHINFOTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.MESHINFOTABLE_INPUT_PROPERTY,
        },
      });

      const collisionOptimizerTable = new aws_glue.CfnTable(this, "CollisionOptimizerTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/collision-optimizer/`,
            ...customParams.COLLISIONOPTIMIZERTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.COLLISIONOPTIMIZERTABLE_INPUT_PROPERTY,
        },
      });

      const characterMoveLogTable = new aws_glue.CfnTable(this, "CharacterMoveLogTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/character-move-log/`,
            ...customParams.CHARACTERMOVELOGTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.CHARACTERMOVELOGTABLE_INPUT_PROPERTY,
        },
      });

      const characterStartLogTable = new aws_glue.CfnTable(this, "CharacterStartLogTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/character-start-log/`,
            ...customParams.CHARACTERSTARTLOGTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.CHARACTERSTARTLOGTABLE_INPUT_PROPERTY,
        },
      });

      const characterEndLogTable = new aws_glue.CfnTable(this, "CharacterEndLogTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/character-end-log/`,
            ...customParams.CHARACTERENDLOGTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.CHARACTERENDLOGTABLE_INPUT_PROPERTY,
        },
      });

      const characterInfoLogTable = new aws_glue.CfnTable(this, "CharacterInfoLogTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/character-info-log/`,
            ...customParams.CHARACTERINFOLOGTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.CHARACTERINFOLOGTABLE_INPUT_PROPERTY,
        },
      });

      const meshDensityInfoTable = new aws_glue.CfnTable(this, "MeshDensityInfoTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${meshDensityInfoBucketName}/`,
            ...customParams.MESHDENSITYINFOTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.MESHDENSITYINFOTABLE_INPUT_PROPERTY,
        },
      });

      const goalDensityInfoTable = new aws_glue.CfnTable(this, "GoalDensityInfoTable", {
        catalogId: Aws.ACCOUNT_ID,
        databaseName: glueDatabase.ref,
        tableInput: {
          storageDescriptor: {
            location: `s3://${analyzeParquetLogBucketName}/goal-density-info/`,
            ...customParams.GOALDENSITYINFOTABLE_STORAGE_DESCRIPTOR_PROPERTY,
          },
          ...customParams.GOALDENSITYINFOTABLE_INPUT_PROPERTY,
        },
      });

      // データベース名 を SSM Parameter Store に出力する。
      new aws_ssm.StringParameter(this, "StringParameterGlueDatabaseName", {
        parameterName: SSM_PARAM_GLUE_DATABASE_NAME,
        stringValue: glueDatabase.ref,
      });
    }
  }
}
