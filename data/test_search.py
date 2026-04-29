import os
import snowflake.connector
from dotenv import load_dotenv

load_dotenv()

conn = snowflake.connector.connect(
    account=os.getenv("SNOWFLAKE_ACCOUNT"),
    user=os.getenv("SNOWFLAKE_USER"),
    password=os.getenv("SNOWFLAKE_PASSWORD"),
    warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
    database=os.getenv("SNOWFLAKE_DATABASE"),
    schema=os.getenv("SNOWFLAKE_SCHEMA"),
)

cur = conn.cursor()
cur.execute("""
    SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
        'LEGAL_RAG_DB.PUBLIC.REFUGEE_SEARCH',
        '{
            "query": "fear of persecution based on religion",
            "columns": ["TEXT", "METADATA_STR"],
            "limit": 3
        }'
    )
""")

result = cur.fetchone()[0]
print(result)

cur.close()
conn.close()
