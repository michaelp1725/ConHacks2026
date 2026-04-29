import os
import pandas as pd
import snowflake.connector
from snowflake.connector.pandas_tools import write_pandas
from dotenv import load_dotenv

load_dotenv()

TABLE_NAME = "REFUGEE_CASE_CHUNKS"

CORTEX_SEARCH_SQL = f"""
CREATE OR REPLACE CORTEX SEARCH SERVICE REFUGEE_SEARCH
  ON TEXT
  ATTRIBUTES METADATA_STR
  WAREHOUSE = '{os.getenv("SNOWFLAKE_WAREHOUSE")}'
  TARGET_LAG = '1 hour'
  AS (
    SELECT ID, TEXT, METADATA::VARCHAR AS METADATA_STR
    FROM {TABLE_NAME}
  );
"""


def get_connection():
    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
    )


def load_snowflake():
    print("Reading chunks.parquet...")
    df = pd.read_parquet("data/parquets/chunks.parquet")
    print(f"Chunks to upload: {len(df)}")

    print("Connecting to Snowflake...")
    conn = get_connection()
    cur = conn.cursor()

    print("Uploading chunks...")
    _, nchunks, nrows, _ = write_pandas(conn, df, TABLE_NAME)
    print(f"Uploaded {nrows} rows in {nchunks} chunks")

    print("Generating embeddings with Cortex...")
    cur.execute(f"""
        UPDATE {TABLE_NAME}
        SET EMBEDDING = SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', TEXT)
        WHERE EMBEDDING IS NULL
    """)
    print("Embeddings generated.")

    print("Creating Cortex Search service...")
    cur.execute(CORTEX_SEARCH_SQL)
    print("Cortex Search service created.")

    cur.close()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    load_snowflake()
