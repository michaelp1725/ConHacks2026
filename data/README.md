# Data Pipeline

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure your `.env` file in the project root:
   ```
   SNOWFLAKE_ACCOUNT=your_account
   SNOWFLAKE_USER=your_user
   SNOWFLAKE_PASSWORD=your_password
   SNOWFLAKE_WAREHOUSE=your_warehouse
   SNOWFLAKE_DATABASE=your_database
   SNOWFLAKE_SCHEMA=your_schema
   ```

## Running

All commands must be run from the **project root directory**.

Run the full pipeline (prepare → chunk → load to Snowflake):
```bash
python data/pipeline.py
```

Or run individual steps:
```bash
python data/scripts/prepare_dataset.py   # download & filter refugee cases
python data/scripts/chunk.py             # split into chunks
python data/scripts/load_snowflake.py    # upload to Snowflake + create Cortex Search
```

Test the search:
```bash
python data/test_search.py
```
