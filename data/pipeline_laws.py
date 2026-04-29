import sys
sys.path.insert(0, "data/scripts")

from prepare_laws import prepare_laws
from chunk_laws import chunk_laws
from load_laws_snowflake import load_laws_snowflake

if __name__ == "__main__":
    prepare_laws()
    chunk_laws()
    load_laws_snowflake()
