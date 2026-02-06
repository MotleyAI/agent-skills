# Datasource Tools

Tools for working with data sources (cubes) - listing, inspecting, and modifying their schemas.

[Back to Tools Overview](../tools.md)

---

## datasources_summary

List all available data sources with their dimensions, measures, and derived dimensions.

### Arguments

*No arguments required.*

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `datasources` | array | List of cube summaries |
| `count` | integer | Total number of datasources |

Each datasource in the array contains:
- `name` - Cube name (use this with other datasource tools)
- `description` - Human-readable description
- `dimensions` - Array of dimension definitions
- `measures` - Array of measure definitions
- `derived_dimensions` - Array of derived dimension definitions

### Notes

- Does **not** include sample data - use `inspect_datasource` for that
- Use this tool to discover available datasources and their schemas

---

## inspect_datasource

Get detailed information about a specific data source including sample data.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | **Yes** | Exact name of the cube to inspect. |
| `num_rows` | integer | No | Number of sample rows to include. Default: 3. |
| `show_sql` | boolean | No | Include the SQL query/table definition. Default: false. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Cube name |
| `description` | string | Cube description |
| `dimensions` | array | Dimension definitions with `name`, `type`, `description` |
| `measures` | array | Measure definitions with `name`, `type`, `description` |
| `derived_dimensions` | array | Derived dimension definitions with `name`, `expression`, `description` |
| `extended_summary` | string | Formatted summary including sample data |
| `sql` | string | SQL query (only if `show_sql=true`) |
| `sql_table` | string | Table name (only if `show_sql=true`) |
| `sample_data_error` | string | Error message if sample data fetch failed |

---

## create_datasource

Create a new datasource (cube) from a SQL SELECT query.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | **Yes** | Existing cube whose database connection is used for introspection. This becomes the `data_source` on the new cube. |
| `cube_name` | string | **Yes** | Name for the new cube being created. |
| `sql` | string | **Yes** | A valid SQL SELECT query. Column types are introspected from the database. |
| `column_descriptions` | array[object] | No | Per-column descriptions. Each entry has `name` (column name) and `description` (human-readable text). Not every column needs a description. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `cube_name` | string | Name of the created cube |
| `datasource_name` | string | The data source used for connection |
| `dimensions` | array | Auto-generated dimensions from the query |
| `measures` | array | Auto-generated measures from the query |

### Notes

- Column types are automatically introspected from the database
- Dimensions and measures are inferred based on column types
- The `datasource_name` parameter specifies which existing cube's database connection to use

---

## add_measures

Add one or more custom measures to an existing datasource (cube).

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | **Yes** | The cube to add measures to. |
| `measures` | array[MeasureSpec] | **Yes** | List of measure specifications to add. |

Each **MeasureSpec** contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Measure identifier. Must not already exist on the cube. |
| `sql` | string | **Yes** | SQL expression (e.g., `"CASE WHEN status = 'active' THEN 1 ELSE 0 END"`). |
| `type` | string | **Yes** | Aggregation type. One of: `count`, `count_distinct`, `count_distinct_approx`, `sum`, `avg`, `min`, `max`, `number`. |
| `description` | string | No | Human-readable description. |
| `format` | string | No | Display format: `percent`, `currency`, `integer`, `float`. |
| `currency_symbol` | string | No | Currency symbol when `format='currency'`. Defaults to `'$'`. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `datasource_name` | string | The cube that was modified |
| `added_measures` | array | List of added measures with `name`, `type`, `sql` |
| `count` | integer | Number of measures added |
| `message` | string | Summary message |

### Valid Measure Types

| Type | Description |
|------|-------------|
| `count` | Count of rows |
| `count_distinct` | Count of distinct values |
| `count_distinct_approx` | Approximate distinct count (faster) |
| `sum` | Sum of values |
| `avg` | Average of values |
| `min` | Minimum value |
| `max` | Maximum value |
| `number` | Raw number (no aggregation) |

---

## add_dimensions

Add one or more custom dimensions to an existing datasource (cube).

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | **Yes** | The cube to add dimensions to. |
| `dimensions` | array[DimensionSpec] | **Yes** | List of dimension specifications to add. |

Each **DimensionSpec** contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Dimension identifier. Must not already exist on the cube. |
| `sql` | string | **Yes** | SQL expression for the dimension. |
| `type` | string | **Yes** | Data type. One of: `string`, `time`, `date`, `boolean`, `number`. |
| `description` | string | No | Human-readable description. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `datasource_name` | string | The cube that was modified |
| `added_dimensions` | array | List of added dimensions with `name`, `type`, `sql` |
| `count` | integer | Number of dimensions added |
| `message` | string | Summary message |

### Valid Dimension Types

| Type | Description |
|------|-------------|
| `string` | Text values |
| `time` | Timestamp/datetime values |
| `date` | Date values (no time component) |
| `boolean` | True/false values |
| `number` | Numeric values |

---

## delete_measures_dimensions

Delete one or more measures, dimensions, or derived dimensions by name from a cube.

### Arguments

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datasource_name` | string | **Yes** | The cube to modify. |
| `names` | array[string] | **Yes** | Names of measures, dimensions, or derived dimensions to delete. The tool searches all three categories. |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `datasource_name` | string | The cube that was modified |
| `deleted` | array | List of deleted items with `name` and `kind` (measure, dimension, or derived_dimension) |
| `count` | integer | Number of items deleted |
| `message` | string | Summary message |

### Notes

- The tool searches measures first, then dimensions, then derived dimensions
- If a name is not found in any category, an error is raised
- All specified names must exist for the operation to succeed
