import { aws_ssm, aws_athena, Stack } from 'aws-cdk-lib';
import { Construct } from "constructs";
import {
  ATHENA_WORK_GROUP_NAME,
  PLATEAU_ENV,
  SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME,
} from "./constants";

export class PFSAthenaStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      description: `PeopleFlowSim Athena Stack (${PLATEAU_ENV})`,
    });

    const glueWorkBucketName = aws_ssm.StringParameter.valueForStringParameter(this, SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME);

    // Athenaワークグループを作成する
    new aws_athena.CfnWorkGroup(this, "AthenaWorkgroup", {
      name: ATHENA_WORK_GROUP_NAME,
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${glueWorkBucketName}/athenaResult/`,
        },
        enforceWorkGroupConfiguration: false
      },
    });
  }
}
