import pandas as pd

df = pd.read_parquet("data/all_cases.parquet")

row = df.iloc[0]

for col, val in row.items():
    print(f"=== {col} ===")
    print(val)
    print()

print(df['name_en'].notna().sum())