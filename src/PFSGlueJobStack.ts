import * as fs from "fs";
import { aws_ssm, aws_glue, aws_s3_deployment, aws_s3, aws_iam, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  SSM_PARAM_GLUE_DATABASE_NAME,
  SSM_PARAM_S3_ANALYZE_CSV_LOG_BUCKET_NAME,
  SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME,
  SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME,
  SSM_PARAM_S3_GLUE_SCRIPTS_BUCKET_NAME,
  SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME,
  SSM_PARAM_GLUE_CSV2PARQUET_JOB_NAME,
  SSM_PARAM_GLUE_DENSITYCALC_JOB_NAME,
  PLATEAU_ENV,
} from "./constants";

export class PFSGlueJobStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      description: `PeopleFlowSim Glue Job Stack (${PLATEAU_ENV})`,
    });

    const analyzeCsvLogBucket = aws_s3.Bucket.fromBucketName(this, "LogBucket", aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_ANALYZE_CSV_LOG_BUCKET_NAME));
    const analyzeParquetLogBucket = aws_s3.Bucket.fromBucketName(this, "ParquetLogBucket", aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME));
    const meshDensityInfoBucket = aws_s3.Bucket.fromBucketName(this, "MeshDensityInfoBucket", aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME));
    const glueWorkBucket = aws_s3.Bucket.fromBucketName(this, "GlueWorkBucket", aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME));
    const glueScriptsBucket = aws_s3.Bucket.fromBucketName(this, "GlueScriptsBucket", aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_GLUE_SCRIPTS_BUCKET_NAME));

    // ソースファイルをアップロード
    if (fs.existsSync("Modules/glueScripts/csv2parquet.py")) {
      new aws_s3_deployment.BucketDeployment(this, "csv2parquetScriptDeployment", {
        sources: [aws_s3_deployment.Source.asset("Modules/glueScripts")],
        destinationBucket: glueScriptsBucket,
        destinationKeyPrefix: "csv2parquet/",
      });

      // Glueデータベース名取得
      const glueDatabaseName = aws_ssm.StringParameter.valueFromLookup(this, SSM_PARAM_GLUE_DATABASE_NAME);

      // ロールを作成
      const jobRole = new aws_iam.Role(this, "JobRole", {
        assumedBy: new aws_iam.ServicePrincipal("glue.amazonaws.com"),
      });
      analyzeCsvLogBucket.grantReadWrite(jobRole);
      analyzeParquetLogBucket.grantReadWrite(jobRole);
      meshDensityInfoBucket.grantReadWrite(jobRole);
      glueScriptsBucket.grantRead(jobRole);
      glueWorkBucket.grantReadWrite(jobRole);
      jobRole.addManagedPolicy(aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole"));

      // ジョブを作成
      const csv2parquet = new aws_glue.CfnJob(this, "csv2parquet", {
        command: {
          name: "glueetl",
          scriptLocation: `s3://${glueScriptsBucket.bucketName}/csv2parquet/csv2parquet.py`,
        },
        role: jobRole.roleArn,
        glueVersion: "3.0",
        workerType: "G.1X",
        numberOfWorkers: 10,
        executionProperty: {
          maxConcurrentRuns: 10,
        },
        defaultArguments: {
          "--class": "GlueApp",
          "--DATABASE": glueDatabaseName,
          "--INPUT_BUCKET": analyzeCsvLogBucket.bucketName,
          "--OUTPUT_BUCKET": analyzeParquetLogBucket.bucketName,
          "--enable-continuous-cloudwatch-log": "true",
          "--enable-glue-datacatalog": "true",
          "--enable-job-insights": "true",
          "--enable-metrics": "true",
          "--enable-spark-ui": "true",
          "--job-bookmark-option": "job-bookmark-enable",
          "--job-language": "python",
          "--TempDir": `s3://${glueWorkBucket.bucketName}/temporary/csv2parquet/`,
          "--spark-event-logs-path": `s3://${glueWorkBucket.bucketName}/sparkHistoryLogs/csv2parquet/`,
        },
      });

      // ジョブ名をパラメータストアへ保存
      new aws_ssm.StringParameter(this, "csv2parquetJobName", {
        parameterName: SSM_PARAM_GLUE_CSV2PARQUET_JOB_NAME,
        stringValue: csv2parquet.ref,
      });

      // ソースファイルをアップロード
      if (fs.existsSync("LicensedContents/DensityCalcApp/src/main/scala/DensityCalcSampleApp.scala")) {
        new aws_s3_deployment.BucketDeployment(this, "DensityCalcScriptDeployment", {
          sources: [aws_s3_deployment.Source.asset("LicensedContents/DensityCalcApp/src/main/scala")],
          destinationBucket: glueScriptsBucket,
          destinationKeyPrefix: "DensityCalc/",
        });

        const DensityCalcSampleApp = new aws_glue.CfnJob(this, "DensityCalcSampleApp", {
          command: {
            name: "glueetl",
            scriptLocation: `s3://${glueScriptsBucket.bucketName}/DensityCalc/DensityCalcSampleApp.scala`,
          },
          role: jobRole.roleArn,
          glueVersion: "3.0",
          workerType: "G.1X",
          numberOfWorkers: 20,
          executionProperty: {
            maxConcurrentRuns: 10,
          },
          defaultArguments: {
            "--class": "DensityCalcSampleApp",
            "--Database": glueDatabaseName,
            "--OutputBucketPath": `s3://${meshDensityInfoBucket.bucketName}`,
            "--enable-continuous-cloudwatch-log": "true",
            "--enable-glue-datacatalog": "true",
            "--enable-job-insights": "true",
            "--enable-metrics": "true",
            "--enable-spark-ui": "true",
            "--job-bookmark-option": "job-bookmark-disable",
            "--job-language": "scala",
            "--TempDir": `s3://${glueWorkBucket.bucketName}/temporary/DensityCalcSampleApp/`,
            "--spark-event-logs-path": `s3://${glueWorkBucket.bucketName}/sparkHistoryLogs/DensityCalcSampleApp/`,
          },
        });

        // ジョブ名をパラメータストアへ保存
        new aws_ssm.StringParameter(this, "DensityCalcSampleAppJobName", {
          parameterName: SSM_PARAM_GLUE_DENSITYCALC_JOB_NAME,
          stringValue: DensityCalcSampleApp.ref,
        });
      }
    }
  }
}
