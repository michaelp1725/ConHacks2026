import json
import uuid
import pandas as pd
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk():
    print("Reading refugee_clean.parquet...")
    df = pd.read_parquet("data/parquets/refugee_clean.parquet")
    print(f"Cases to chunk: {len(df)}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        length_function=len,
    )

    chunks = []
    for _, row in df.iterrows():
        splits = splitter.split_text(row["unofficial_text_en"])
        for split in splits:
            chunks.append({
                "ID": str(uuid.uuid4()),
                "TEXT": split,
                "METADATA": json.dumps({
                    "citation": row["citation_en"],
                    "url": row["url_en"],
                    "document_date": str(row["document_date_en"]),
                    "dataset": row["dataset"],
                }),
            })

    chunks_df = pd.DataFrame(chunks)
    print(f"Total chunks: {len(chunks_df)}")

    chunks_df.to_parquet("data/parquets/chunks.parquet", index=False)
    print("Saved to data/parquets/chunks.parquet")


if __name__ == "__main__":
    chunk()
