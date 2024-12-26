/**
 * デプロイ対象の環境名。
 */
export const PLATEAU_ENV = process.env.PLATEAU_ENV!;

export const GLUE_DATABASE_NAME = `pfs_${PLATEAU_ENV}`;

export const SSM_PARAM_GLUE_CSV2PARQUET_JOB_NAME = `/pfs-${PLATEAU_ENV}/glue/job/csv2parquet/Name`;
export const SSM_PARAM_GLUE_DATABASE_NAME = `/pfs-${PLATEAU_ENV}/glue/DataBase`;
export const SSM_PARAM_GLUE_DENSITYCALC_JOB_NAME = `/pfs-${PLATEAU_ENV}/glue/job/DensityCalc/Name`;
export const SSM_PARAM_GLUE_WORKFLOW_NAME = `/pfs-${PLATEAU_ENV}/glue/workflow/Name`;
export const SSM_PARAM_QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_ARN = `/pfs-${PLATEAU_ENV}/QuickSight/DataSet/EvacuationElapsed/ARN`;
export const SSM_PARAM_QUICK_SIGHT_MESH_INFO_DATASET_ARN = `/pfs-${PLATEAU_ENV}/QuickSight/DataSet/MeshInfo/ARN`;
export const SSM_PARAM_QUICK_SIGHT_GOAL_DENSITY_INFO_DATASET_ARN = `/pfs-${PLATEAU_ENV}/QuickSight/DataSet/GoalDensityInfo/ARN`;
export const SSM_PARAM_S3_3D_MODEL_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/3DModelBucketName`;
export const SSM_PARAM_S3_ANALYZE_CSV_LOG_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/AnalyzeCsvLogBucketName`;
export const SSM_PARAM_S3_ANALYZE_PARQUET_LOG_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/AnalyzeParquetLogBucketName`;
export const SSM_PARAM_S3_MESH_DENSITY_INFO_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/MeshDensityInfoBucketName`;
export const SSM_PARAM_S3_GLUE_SCRIPTS_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/GlueScriptsBucketName`;
export const SSM_PARAM_S3_GLUE_WORK_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/GlueWorkBucketName`;
export const SSM_PARAM_S3_REPLAY_BUCKET_NAME = `/pfs-${PLATEAU_ENV}/s3/ReplayBucketName`;

/*
 QuickSight
*/
export const ATHENA_WORK_GROUP_NAME = `pfs_${PLATEAU_ENV}`;
export const QUICK_SIGHT_DATA_SOURCE_NAME = `pfs_${PLATEAU_ENV}`;
export const QUICK_SIGHT_MESH_INFO_DATASET_ID = `ds_mesh_info_${PLATEAU_ENV}`;
export const QUICK_SIGHT_MESH_INFO_DATASET_NAME = `密度計算結果 ${PLATEAU_ENV}`;
export const QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_ID = `ds_evacuation_elapsed_${PLATEAU_ENV}`;
export const QUICK_SIGHT_EVACUATION_ELAPSED_DATASET_NAME = `移動完了時間ごとのキャラクター数 ${PLATEAU_ENV}`;
export const QUICK_SIGHT_GOAL_DENSITY_DATASET_ID = `ds_goal_density_${PLATEAU_ENV}`;
export const QUICK_SIGHT_GOAL_DENSITY_DATASET_NAME = `ゴールエリア密度計算結果 ${PLATEAU_ENV}`;