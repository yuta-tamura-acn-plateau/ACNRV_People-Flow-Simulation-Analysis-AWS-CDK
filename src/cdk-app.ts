#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PFSS3Stack } from "./PFSS3Stack";
import { PFSGlueDbStack } from "./PFSGlueDbStack";
import { PFSGlueJobStack } from "./PFSGlueJobStack";
import { PFSGlueWorkflowStack } from "./PFSGlueWorkflowStack";
import { PFSAthenaStack } from "./PFSAthenaStack";
import { PFSQuickSightStack } from "./PFSQuickSightStack";
import { PLATEAU_ENV, SSM_PARAM_GLUE_CSV2PARQUET_JOB_NAME, SSM_PARAM_GLUE_DENSITYCALC_JOB_NAME } from "./constants";
import { QuickSight } from "@aws-sdk/client-quicksight";
import { STS } from "@aws-sdk/client-sts";
import { SSM } from "@aws-sdk/client-ssm";

/**
 * 有効な環境名
 */
const VALID_ENV_NAMES = ["prod", "dev"];

async function main() {
  if (!PLATEAU_ENV) {
    throw new Error(`Missing environment variable PLATEAU_ENV`);
  }

  if (!VALID_ENV_NAMES.includes(PLATEAU_ENV)) {
    throw new Error(`The environment name must be one of ${VALID_ENV_NAMES.join(", ")}`);
  }

  const sts = new STS();

  const getCallerIdentityResult = await sts.getCallerIdentity();

  if (!getCallerIdentityResult.Account) {
    throw new Error("Unknown AWS Account");
  }

  const quicksight = new QuickSight();

  const listUsersResult = await quicksight.listUsers({
    AwsAccountId: getCallerIdentityResult.Account,
    Namespace: "default",
  });

  if (!listUsersResult.UserList) {
    throw new Error("No QuickSight users");
  }

  const ssm = new SSM();

  let csv2parquetJob: string | undefined;
  let densityCalcJob: string | undefined;
  try {
    csv2parquetJob = (await ssm.getParameter({ Name: SSM_PARAM_GLUE_CSV2PARQUET_JOB_NAME })).Parameter?.Value;
    densityCalcJob = (await ssm.getParameter({ Name: SSM_PARAM_GLUE_DENSITYCALC_JOB_NAME })).Parameter?.Value;
  } catch (error) {
    console.log(error);
  }

  const app = new cdk.App();
  new PFSS3Stack(app, `PFSS3Stack-${PLATEAU_ENV}`);
  new PFSGlueJobStack(app, `PFSGlueJobStack-${PLATEAU_ENV}`);
  new PFSAthenaStack(app, `PFSAthenaStack-${PLATEAU_ENV}`);
  new PFSGlueWorkflowStack(app, `PFSGlueWorkflowStack-${PLATEAU_ENV}`, { csv2parquetJob, densityCalcJob });

  try {
    // Modulesのインポート
    const glueDbStackCustomParamsPath = "../Modules/StackModule/PFSGlueDbStackCustomParams";
    const glueDbStackCustomParams = await import(glueDbStackCustomParamsPath);
    const quickSightStackCustomParamsPath = "../Modules/StackModule/PFSQuickSightStackCustomParams";
    const quickSightStackCustomParams = await import(quickSightStackCustomParamsPath);

    new PFSGlueDbStack(app, `PFSGlueDbStack-${PLATEAU_ENV}`, {
      customParams: glueDbStackCustomParams,
    });
    new PFSQuickSightStack(app, `PFSQuickSightStack-${PLATEAU_ENV}`, {
      userList: listUsersResult.UserList,
      customParams: quickSightStackCustomParams,
    });
  } catch (error) {
    new PFSGlueDbStack(app, `PFSGlueDbStack-${PLATEAU_ENV}`, {
      customParams: {},
    });
    new PFSQuickSightStack(app, `PFSQuickSightStack-${PLATEAU_ENV}`, {
      userList: listUsersResult.UserList,
      customParams: {},
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
