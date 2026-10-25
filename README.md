# cauce.blog

Every push to `main` deploys to https://cauce.blog (Porkbun, GitHub Connect).

## Where to edit
- `src/draft.html` is the source of the whole site (one page, all views, styles and scripts).
- Run `python3 tools/build.py` to regenerate `index.html` from it, then commit both files.
- Do not edit `index.html` by hand; the next build overwrites it.
- `src/hairline/` holds the illustration sources (`kit.txt` is shared; `build.py` assembles the figures).
- `vendor/` is MapLibre GL 4.7.1 (BSD-3). `fonts/` is Helvetica Now Display (licensed to Cauce).
- `data/bcv.json` is written once a day by `.github/workflows/bcv.yml` from bcv.org.ve. Don't edit it by hand.

## Language
Spanish is the source. English lives in the `EN` dictionary inside `src/draft.html`, keyed by the exact Spanish text. Add a line there for every new Spanish string.
- `supabase/schema.sql` creates the `profiles` table (run once in Supabase SQL Editor). Accounts use Supabase Auth; `vendor/supabase.js` is supabase-js 2.118.0 (MIT), loaded after the page.
