import { aws_ssm, aws_glue, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PLATEAU_ENV, SSM_PARAM_GLUE_WORKFLOW_NAME } from "./constants";

interface PFSGlueWorkflowStackProps {
  csv2parquetJob: string | undefined;
  densityCalcJob: string | undefined;
}

export class PFSGlueWorkflowStack extends Stack {
  constructor(scope: Construct, id: string, props: PFSGlueWorkflowStackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      description: `PeopleFlowSim Glue Workflow Stack (${PLATEAU_ENV})`,
    });

    const { csv2parquetJob, densityCalcJob } = props;

    // ワークフロー
    const workflow = new aws_glue.CfnWorkflow(this, "WorkflowEvacuationAnalyze", {
      defaultRunProperties: {
        Target: "",
      },
      description: "密集分析＆避難完了時間分析",
    });

    if (csv2parquetJob) {
      // スタートトリガー
      const TriggerStart = new aws_glue.CfnTrigger(this, "StartWorkflow", {
        description: "Start",
        type: "ON_DEMAND",
        actions: [
          {
            jobName: csv2parquetJob,
          },
        ],
        workflowName: workflow.ref,
      });

      if (densityCalcJob) {
        // CSV→parquet変換ジョブ終了トリガー
        const TriggerCompleteCsv2parquetJob = new aws_glue.CfnTrigger(this, "CompleteCsv2parquetJob", {
          description: "Complete Csv2parquetJob",
          type: "CONDITIONAL",
          startOnCreation: true,
          actions: [
            {
              jobName: densityCalcJob,
            },
          ],
          predicate: {
            logical: "ANY",
            conditions: [
              {
                jobName: csv2parquetJob,
                logicalOperator: "EQUALS",
                state: "SUCCEEDED",
              },
            ],
          },
          workflowName: workflow.ref,
        });
      }
    }

    // ワークフロー名をパラメータストアへ保存
    new aws_ssm.StringParameter(this, "StringParameterWorkflowName", {
      parameterName: SSM_PARAM_GLUE_WORKFLOW_NAME,
      stringValue: workflow.ref,
    });
  }
}
