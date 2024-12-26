import { aws_quicksight } from "aws-cdk-lib";
import { GLUE_DATABASE_NAME } from "../../src/constants";

type PlateauCustomSqlProperty = Omit<aws_quicksight.CfnDataSet.CustomSqlProperty, "dataSourceArn"> &
  Partial<Pick<aws_quicksight.CfnDataSet.CustomSqlProperty, "dataSourceArn">>;

// DataSetMeshInfo
export const MESHINFO_CUSTOMSQL: PlateauCustomSqlProperty = {
  columns: [
    {
      name: "mesh_id",
      type: "STRING",
    },
    {
      name: "mesh_name",
      type: "STRING",
    },
    {
      name: "elapsed_time",
      type: "DECIMAL",
    },
    {
      name: "density",
      type: "DECIMAL",
    },
    {
      name: "total_area",
      type: "DECIMAL",
    },
    {
      name: "count",
      type: "INTEGER",
    },
    {
      name: "dt",
      type: "STRING",
    },
  ],
  name: "DirectSQL",
  sqlQuery: `SELECT * FROM "${GLUE_DATABASE_NAME}"."mesh_density_info" ORDER BY elapsed_time`,
};

// DataSetEvacuationElapse
export const EVACUATIONELAPSE_CUSTOMSQL: PlateauCustomSqlProperty = {
  columns: [
    {
      name: "elapsed",
      type: "DECIMAL",
    },
    {
      name: "elapsed_minutes",
      type: "DECIMAL",
    },
    {
      name: "spawnarea_id",
      type: "STRING",
    },
    {
      name: "startarea_name",
      type: "STRING",
    },
    {
      name: "goalarea_name",
      type: "STRING",
    },
    {
      name: "generation",
      type: "STRING",
    },
    {
      name: "sex",
      type: "STRING",
    },
    {
      name: "height",
      type: "DECIMAL",
    },
    {
      name: "width",
      type: "DECIMAL",
    },
    {
      name: "speed",
      type: "DECIMAL",
    },
    {
      name: "dt",
      type: "STRING",
    },
  ],
  name: "DirectSQL",
  sqlQuery: `
  SELECT
      c_start.dt,
      CASE
          WHEN (c_end.elapsed_time - c_start.elapsed_time) < 0 THEN 0
          ELSE (c_end.elapsed_time - c_start.elapsed_time) END AS elapsed,
      CASE
          WHEN (c_end.elapsed_time - c_start.elapsed_time) < 0 THEN 0
          ELSE (c_end.elapsed_time - c_start.elapsed_time) / 60 END AS elapsed_minutes,
      c_info.startarea_name,
      c_info.goalarea_name,
      c_info.generation,
      c_info.sex,
      c_info.height,
      c_info.width,
      c_info.speed
  FROM "${GLUE_DATABASE_NAME}"."character_start_log" AS c_start
  JOIN "${GLUE_DATABASE_NAME}"."character_end_log" AS c_end
      ON c_start.dt = c_end.dt AND c_start.character_id = c_end.character_id
  JOIN "${GLUE_DATABASE_NAME}"."character_info_log" AS c_info
      ON c_start.dt = c_info.dt AND c_start.character_id = c_info.character_id
  GROUP BY
      c_start.dt,
      c_end.elapsed_time - c_start.elapsed_time,
      (c_end.elapsed_time - c_start.elapsed_time) / 60,
      c_info.startarea_name,
      c_info.goalarea_name,
      c_info.generation,
      c_info.sex,
      c_info.height,
      c_info.width,
      c_info.speed
  ORDER BY elapsed
  `,
};

// GoalDensityInfo
export const GOALDENSITYINFO_CUSTOMSQL: PlateauCustomSqlProperty = {
  columns: [
    {
      name: "goalarea_id",
      type: "STRING",
    },
    {
      name: "goalarea_name",
      type: "STRING",
    },
    {
      name: "goal_people_num",
      type: "INTEGER",
    },
    {
      name: "goal_people_area_size",
      type: "DECIMAL",
    },
    {
      name: "goal_people_density",
      type: "DECIMAL",
    },
    {
      name: "density_ratio",
      type: "DECIMAL",
    },
    {
      name: "goal_area_size",
      type: "DECIMAL",
    },
    {
      name: "dt",
      type: "STRING",
    },
  ],
  name: "DirectSQL",
  sqlQuery: `SELECT * FROM "${GLUE_DATABASE_NAME}"."goal_density_info"`,
};
