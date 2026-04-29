import pandas as pd


IMMIGRATION_KEYWORDS = ["immigration", "refugee", "citizenship"]


def prepare_laws():
    print("Loading federal legislation and regulations...")
    leg = pd.read_parquet("hf://datasets/a2aj/canadian-laws/LEGISLATION-FED/train.parquet")
    reg = pd.read_parquet("hf://datasets/a2aj/canadian-laws/REGULATIONS-FED/train.parquet")
    df = pd.concat([leg, reg], ignore_index=True)
    print(f"Federal laws: {len(df)}")

    mask = df["name_en"].str.lower().str.contains("|".join(IMMIGRATION_KEYWORDS), na=False)
    df = df[mask].copy()
    print(f"Immigration/refugee laws: {len(df)}")

    cols = ["dataset", "unofficial_text_en", "document_date_en", "citation_en", "source_url_en", "name_en"]
    df = df[cols]

    df = df[df["unofficial_text_en"].notna() & (df["unofficial_text_en"].str.strip() != "")]
    print(f"After removing empty text: {len(df)}")

    df.to_parquet("data/parquets/laws_clean.parquet", index=False)
    print("Saved to data/parquets/laws_clean.parquet")


if __name__ == "__main__":
    prepare_laws()
