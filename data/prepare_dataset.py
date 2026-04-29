from datasets import load_dataset
import pandas as pd

print("Loading all canadian case law...")
df = load_dataset("a2aj/canadian-case-law", split="train").to_pandas()
print(f"Total cases: {len(df)}")

df = df[df["dataset"].isin(["RPD", "RAD"])].copy()
print(f"Refugee cases (RPD/RAD): {len(df)}")

cols = ["dataset", "unofficial_text_en", "document_date_en", "citation_en", "url_en"]
df = df[cols]

df = df[df["unofficial_text_en"].notna() & (df["unofficial_text_en"].str.strip() != "")]
print(f"After removing empty text: {len(df)}")

df.to_parquet("data/refugee_clean.parquet", index=False)
print("Saved to data/refugee_clean.parquet")
