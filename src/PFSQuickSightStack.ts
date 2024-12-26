import { aws_ssm, aws_quicksight, Aws, aws_s3, aws_iam, CfnResource, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  QUICK_SIGHT_DATA_SOURCE_NAME,
  ATHENA_WORK_GROUP_NAME,
  QUICK_SIGHT_MESH_INFO_DATASET_ID,
  QUICK_SIGHT_MESH_INFO_DATASET_NAME,
  SSM_PARAM_QUICK_SIGHT_MESH_INFO_DATASET_ARN,
  QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_ID,
  QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_NAME,
  SSM_PARAM_QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_ARN,
  PLATEAU_ENV,
  SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME,
  SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME,
  SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME,
  SSM_PARAM_GLUE_DATABASE_NAME,
  QUICK_SIGHT_GOAL_DENSITY_DATASET_ID,
  QUICK_SIGHT_GOAL_DENSITY_DATASET_NAME,
  SSM_PARAM_QUICK_SIGHT_GOAL_DENSITY_INFO_DATASET_ARN,
} from "./constants";
import type { User } from "@aws-sdk/client-quicksight";

export interface PFSQuickSightStackProps {
  userList: User[];
  customParams: any;
}

export class PFSQuickSightStack extends Stack {
  constructor(scope: Construct, id: string, props: PFSQuickSightStackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      description: `PeopleFlowSim QuickSight DataSet Stack (${PLATEAU_ENV})`,
    });

    const { userList, customParams } = props;

    // customParamsがある場合にリソース作成
    if (Object.keys(customParams).length !== 0) {
      const glueDatabaseName = aws_ssm.StringParameter.valueFromLookup(this, SSM_PARAM_GLUE_DATABASE_NAME);

      const paquetBucket = aws_s3.Bucket.fromBucketName(
        this,
        "PaquetBucket",
        aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME)
      );
      const meshDensityInfoBucket = aws_s3.Bucket.fromBucketName(
        this,
        "MeshDensityInfoBucket",
        aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME)
      );
      const workBucket = aws_s3.Bucket.fromBucketName(
        this,
        "WorkBucket",
        aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME)
      );

      // QuickSightに必要な権限を付与する。
      const quickSightRole = aws_iam.Role.fromRoleName(this, "QuickSightServiceRole", "aws-quicksight-service-role-v0");

      const quickSightPolicy = new aws_iam.ManagedPolicy(this, "QuickSightPolicy", {
        statements: [
          new aws_iam.PolicyStatement({
            actions: [
              "s3:GetBucketLocation",
              "s3:GetObject*",
              "s3:ListBucket",
              "s3:ListBucketMultipartUploads",
              "s3:ListMultipartUploadParts",
              "s3:AbortMultipartUpload",
              "s3:CreateBucket",
              "s3:PutObject",
              "s3:PutBucketPublicAccessBlock",
            ],
            resources: [
              paquetBucket.bucketArn,
              `${paquetBucket.bucketArn}/*`,
              meshDensityInfoBucket.bucketArn,
              `${meshDensityInfoBucket.bucketArn}/*`,
              workBucket.bucketArn,
              `${workBucket.bucketArn}/*`,
            ],
          }),
          new aws_iam.PolicyStatement({
            actions: ["athena:ListDataCatalogs"],
            resources: ["*"],
          }),
          new aws_iam.PolicyStatement({
            actions: [
              "athena:StartQueryExecution",
              "athena:GetQueryResults",
              "athena:ListQueryExecutions",
              "athena:StopQueryExecution",
              "athena:GetQueryResultsStream",
              "athena:GetQueryExecution",
              "athena:BatchGetQueryExecution",
            ],
            resources: [
              this.formatArn({
                service: "athena",
                resource: "workgroup",
                resourceName: ATHENA_WORK_GROUP_NAME,
              }),
            ],
          }),
          new aws_iam.PolicyStatement({
            actions: ["glue:GetTable", "glue:GetTables", "glue:GetPartition*"],
            resources: [
              this.formatArn({
                service: "glue",
                resource: "catalog",
              }),
              this.formatArn({
                service: "glue",
                resource: "database",
                resourceName: glueDatabaseName,
              }),
              this.formatArn({
                service: "glue",
                resource: "table",
                resourceName: `${glueDatabaseName}/*`,
              }),
            ],
          }),
        ],
        roles: [quickSightRole],
      });

      // データソース、データセットのパーミッションを編集する。
      let dataSourcePermissions: { actions: string[]; principal: string }[] = [];
      let dataSetPermissions: { actions: string[]; principal: string }[] = [];

      userList.forEach((user) => {
        if (!user.Arn) {
          return;
        }

        dataSourcePermissions.push({
          actions: [
            "quicksight:UpdateDataSourcePermissions",
            "quicksight:DescribeDataSourcePermissions",
            "quicksight:PassDataSource",
            "quicksight:DescribeDataSource",
            "quicksight:DeleteDataSource",
            "quicksight:UpdateDataSource",
          ],
          principal: user.Arn,
        });

        dataSetPermissions.push({
          actions: [
            "quicksight:PassDataSet",
            "quicksight:DescribeIngestion",
            "quicksight:CreateIngestion",
            "quicksight:UpdateDataSet",
            "quicksight:DeleteDataSet",
            "quicksight:DescribeDataSet",
            "quicksight:CancelIngestion",
            "quicksight:DescribeDataSetPermissions",
            "quicksight:ListIngestions",
            "quicksight:UpdateDataSetPermissions",
          ],
          principal: user.Arn,
        });
      });

      // データソース
      const dataSource = new aws_quicksight.CfnDataSource(this, "QuickSightDataSource", {
        awsAccountId: Aws.ACCOUNT_ID,
        dataSourceId: QUICK_SIGHT_DATA_SOURCE_NAME,
        name: QUICK_SIGHT_DATA_SOURCE_NAME,
        type: "ATHENA",
        dataSourceParameters: {
          athenaParameters: {
            workGroup: ATHENA_WORK_GROUP_NAME,
          },
        },
        permissions: dataSourcePermissions,
      });

      dataSource.addDependency(quickSightPolicy.node.findChild("Resource") as CfnResource);

      // データセット（メッシュ分析）
      const dataSetMeshInfo = new aws_quicksight.CfnDataSet(this, "QuickSightDataSetStack1", {
        awsAccountId: Aws.ACCOUNT_ID,
        dataSetId: QUICK_SIGHT_MESH_INFO_DATASET_ID,
        name: QUICK_SIGHT_MESH_INFO_DATASET_NAME,
        importMode: "DIRECT_QUERY",
        physicalTableMap: {
          physicalTableMapKey: {
            customSql: {
              dataSourceArn: dataSource.attrArn,
              ...customParams.MESHINFO_CUSTOMSQL,
            },
          },
        },
        permissions: dataSetPermissions,
      });

      // データセット（避難完了時間）
      const dataSetEvacuationElapse = new aws_quicksight.CfnDataSet(this, "QuickSightDataSetStack2", {
        awsAccountId: Aws.ACCOUNT_ID,
        dataSetId: QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_ID,
        name: QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_NAME,
        importMode: "DIRECT_QUERY",
        physicalTableMap: {
          physicalTableMapKey: {
            customSql: {
              dataSourceArn: dataSource.attrArn,
              ...customParams.EVACUATIONELAPSE_CUSTOMSQL,
            },
          },
        },
        permissions: dataSetPermissions,
      });

      // データセット（ゴールエリア面積計算keisan）
      const dataSetGoalDensityInfo = new aws_quicksight.CfnDataSet(this, "QuickSightDataSetStack3", {
        awsAccountId: Aws.ACCOUNT_ID,
        dataSetId: QUICK_SIGHT_GOAL_DENSITY_DATASET_ID,
        name: QUICK_SIGHT_GOAL_DENSITY_DATASET_NAME,
        importMode: "DIRECT_QUERY",
        physicalTableMap: {
          physicalTableMapKey: {
            customSql: {
              dataSourceArn: dataSource.attrArn,
              ...customParams.GOALDENSITYINFO_CUSTOMSQL,
            },
          },
        },
        permissions: dataSetPermissions,
      });

      // データセットのARNをパラメータストアに保存
      new aws_ssm.StringParameter(this, "StringParameterMeshInfoDataSet", {
        parameterName: SSM_PARAM_QUICK_SIGHT_MESH_INFO_DATASET_ARN,
        stringValue: dataSetMeshInfo.attrArn,
      });
      new aws_ssm.StringParameter(this, "StringParameterEvacuationElapsedDataSet", {
        parameterName: SSM_PARAM_QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_ARN,
        stringValue: dataSetEvacuationElapse.attrArn,
      });
      new aws_ssm.StringParameter(this, "StringParameterGoalDensityInfoDataSet", {
        parameterName: SSM_PARAM_QUICK_SIGHT_GOAL_DENSITY_INFO_DATASET_ARN,
        stringValue: dataSetGoalDensityInfo.attrArn,
      });
    }
  }
}
