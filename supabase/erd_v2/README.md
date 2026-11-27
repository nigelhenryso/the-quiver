# ERD v2 (STSWENG_ERD_1.pdf) — applied 2026-11-28

Run in order: 01_schema.sql → 02_access.sql → 03_rpcs.sql → 04_seed.sql.

- Live project: applied as migrations erd_v2_01a … erd_v2_04e.
- Pre-change copy of every public table, plus function and policy definitions: schema `backup_20261128`.
- These files replace the catalog/order parts of ../policies/*.sql (Tag, ProductTag, VariantTypes, VariantOption,
  ProductVariantCombination, CombinationOption are gone).
- Image columns hold storage paths: `images/…` (stock catalog photos) or `product-media/…` (org uploads).
  `resolveProductMedia` signs both.
