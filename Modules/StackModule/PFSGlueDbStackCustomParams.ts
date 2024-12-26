import { aws_glue } from "aws-cdk-lib";

export const BOXCOLS = [
  {
    name: "min_z",
    type: "double",
  },
  {
    name: "max_z",
    type: "double",
  },
  {
    name: "p0x",
    type: "double",
  },
  {
    name: "p0y",
    type: "double",
  },
  {
    name: "p1x",
    type: "double",
  },
  {
    name: "p1y",
    type: "double",
  },
  {
    name: "p2x",
    type: "double",
  },
  {
    name: "p2y",
    type: "double",
  },
];

// MeshInfoTable Property
export const MESHINFOTABLE_INPUT_PROPERTY: Partial<aws_glue.CfnTable.TableInputProperty> = {
  name: "mesh_info",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const MESHINFOTABLE_STORAGE_DESCRIPTOR_PROPERTY: Partial<aws_glue.CfnTable.StorageDescriptorProperty> = {
  columns: [
    {
      name: "mesh_id",
      type: "string",
    },
    {
      name: "mesh_name",
      type: "string",
    },
    {
      name: "size",
      type: "double",
    },
    ...BOXCOLS,
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};

// CollisionOptimizerTable Property
export const COLLISIONOPTIMIZERTABLE_INPUT_PROPERTY: Partial<aws_glue.CfnTable.TableInputProperty> = {
  name: "collision_optimizer",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const COLLISIONOPTIMIZERTABLE_STORAGE_DESCRIPTOR_PROPERTY: Partial<aws_glue.CfnTable.StorageDescriptorProperty> =
  {
    columns: [
      {
        name: "mesh_id",
        type: "string",
      },
      {
        name: "collisionoptimizer_id",
        type: "string",
      },
      {
        name: "collisionoptimizer_name",
        type: "string",
      },
      ...BOXCOLS,
    ],
    inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
    numberOfBuckets: 0,
    outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
    serdeInfo: {
      serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
    },
  };

// CharacterMoveLogTable Property
export const CHARACTERMOVELOGTABLE_INPUT_PROPERTY: Partial<aws_glue.CfnTable.TableInputProperty> = {
  name: "character_move_log",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const CHARACTERMOVELOGTABLE_STORAGE_DESCRIPTOR_PROPERTY: Partial<aws_glue.CfnTable.StorageDescriptorProperty> = {
  columns: [
    {
      name: "character_id",
      type: "string",
    },
    {
      name: "elapsed_time",
      type: "double",
    },
    {
      name: "coordinate_x",
      type: "double",
    },
    {
      name: "coordinate_y",
      type: "double",
    },
    {
      name: "coordinate_z",
      type: "double",
    },
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};

// CharacterStartLogTable Property
export const CHARACTERSTARTLOGTABLE_INPUT_PROPERTY = {
  name: "character_start_log",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const CHARACTERSTARTLOGTABLE_STORAGE_DESCRIPTOR_PROPERTY = {
  columns: [
    {
      name: "character_id",
      type: "string",
    },
    {
      name: "elapsed_time",
      type: "double",
    },
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};

// CharacterEndLogTable Property
export const CHARACTERENDLOGTABLE_INPUT_PROPERTY = {
  name: "character_end_log",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const CHARACTERENDLOGTABLE_STORAGE_DESCRIPTOR_PROPERTY = {
  columns: [
    {
      name: "character_id",
      type: "string",
    },
    {
      name: "elapsed_time",
      type: "double",
    },
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};

// CharacterInfoLogTable Property
export const CHARACTERINFOLOGTABLE_INPUT_PROPERTY = {
  name: "character_info_log",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const CHARACTERINFOLOGTABLE_STORAGE_DESCRIPTOR_PROPERTY = {
  columns: [
    {
      name: "character_id",
      type: "string",
    },
    {
      name: "generation",
      type: "string",
    },
    {
      name: "sex",
      type: "string",
    },
    {
      name: "height",
      type: "double",
    },
    {
      name: "width",
      type: "double",
    },
    {
      name: "speed",
      type: "double",
    },
    {
      name: "startarea_name",
      type: "string",
    },
    {
      name: "goalarea_name",
      type: "string",
    },
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};

// MeshDensityInfoTable Property
export const MESHDENSITYINFOTABLE_INPUT_PROPERTY = {
  name: "mesh_density_info",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const MESHDENSITYINFOTABLE_STORAGE_DESCRIPTOR_PROPERTY = {
  columns: [
    {
      name: "mesh_id",
      type: "string",
    },
    {
      name: "mesh_name",
      type: "string",
    },
    {
      name: "elapsed_time",
      type: "double",
    },
    {
      name: "density",
      type: "double",
    },
    {
      name: "total_area",
      type: "double",
    },
    {
      name: "count",
      type: "int",
    },
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};

// GoalDensityInfoTable Property
export const GOALDENSITYINFOTABLE_INPUT_PROPERTY = {
  name: "goal_density_info",
  tableType: "EXTERNAL_TABLE",
  partitionKeys: [
    {
      name: "dt",
      type: "string",
    },
  ],
  parameters: {
    classification: "parquet",
  },
};

export const GOALDENSITYINFOTABLE_STORAGE_DESCRIPTOR_PROPERTY = {
  columns: [
    {
      name: "goalarea_id",
      type: "string",
    },
    {
      name: "goalarea_name",
      type: "string",
    },
    {
      name: "goal_people_num",
      type: "int",
    },
    {
      name: "goal_people_area_size",
      type: "double",
    },
    {
      name: "goal_people_density",
      type: "double",
    },
    {
      name: "density_ratio",
      type: "double",
    },
    {
      name: "goal_area_size",
      type: "double",
    },
  ],
  inputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
  numberOfBuckets: 0,
  outputFormat: "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
  serdeInfo: {
    serializationLibrary: "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
  },
};
