import sys
sys.path.insert(0, "data/scripts")

from prepare_dataset import prepare_dataset
from chunk import chunk
from load_snowflake import load_snowflake

if __name__ == "__main__":
    prepare_dataset()
    chunk()
    load_snowflake()
