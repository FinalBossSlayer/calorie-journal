# CLAUDE.md — Calorie Journal (working name)

Personal calorie journal for Android, built for Macedonian food. Its niche: a recipe
builder for home-made dishes (tavče gravče, sarma, burek…) that are missing from
standard apps. Offline-first, single user, designed so a shared food index can be
added later.

The owner knows JavaScript and React (frontend). Explain native/mobile concepts
briefly when they come up. Windows development machine; testing on a real Android
phone via Expo Go.

## Working rules

- Always propose a short plan before writing code for a new milestone, and wait for approval.
- Work in small steps. After each working step, tell me how to test it on my phone.
- Install packages with `npx expo install <pkg>` (keeps versions compatible with the Expo SDK).
- Library APIs change: check the installed version and its docs before using an API
  you are unsure about (especially expo-sqlite, drizzle, expo-router, nativewind).
- Suggest a git commit message at the end of every working milestone.
- Never hardcode UI text. Every string goes through i18n keys (mk + en).
- Never hardcode colors. Use the theme tokens below.
- TypeScript strict mode. No `any` unless justified in a comment.
- Pure logic (calculator, transliteration, recipe math) lives in `src/lib/` with Jest tests.

## Stack

- Expo (managed workflow) + React Native + TypeScript
- Expo Router (file-based routing, bottom tabs)
- expo-sqlite + Drizzle ORM (typed schema, migrations)
- SQLite FTS5 for food search
- Zustand for app state
- react-hook-form + zod for forms
- NativeWind (Tailwind) for styling, light/dark via system setting
- i18next + react-i18next + expo-localization
- react-native-gifted-charts for charts
- Jest for unit tests
- APK builds: EAS Build, `preview` profile with `buildType: "apk"`

## Folder structure

```
app/                    Expo Router screens
  (tabs)/               today, history, foods, profile
  food/[id].tsx         food detail + log
  recipe/[id].tsx       recipe builder
  onboarding/           first-run profile setup
src/
  db/                   schema.ts, client.ts, migrations/, queries/
  lib/                  nutrition.ts, targets.ts, translit.ts, recipe.ts (+ tests)
  features/             UI components grouped by feature
  i18n/                 index.ts, mk.json, en.json
  theme/                tokens.ts, tailwind config source
  store/                zustand stores
scripts/
  seed/                 Node scripts: USDA import, translations, seed recipes
assets/db/app.db        prebuilt database shipped with the app
```

## Design system — "Dark and bold"

Follows the phone's light/dark setting. Big bold numbers, small muted labels,
rounded cards (12px), no shadows, no gradients. One accent button per screen.
Macro colors are identical everywhere in the app (ring, lists, detail, charts).

| Token          | Dark    | Light   |
|----------------|---------|---------|
| background     | #141413 | #F7F6F2 |
| surface        | #2C2C2A | #FFFFFF |
| border         | #444441 | #D3D1C7 |
| text           | #F1EFE8 | #2C2C2A |
| textMuted      | #B4B2A9 | #5F5E5A |
| accent         | #97C459 | #3B6D11 |
| onAccent       | #173404 | #FFFFFF |
| protein        | #85B7EB | #185FA5 |
| carbs          | #FAC775 | #854F0B |
| fat            | #F0997B | #993C1D |
| over (limit)   | #E24B4A | #A32D2D |

Bottom tabs: Today, History, Foods, Profile.
Today screen: date header, calorie ring (mode: "eaten" or "left", set in settings),
three macro tiles, a compact row for fiber/sugar/salt, meal cards with totals,
"+ Add food" button.

## Data model

All IDs are UUID strings. All user-editable tables have `createdAt`, `updatedAt`,
`deletedAt` (soft delete). This is required for future sync — never hard-delete.

- **profile** (single row): sex, birthDate, heightCm, weightKg, activityLevel,
  goal ('lose' | 'maintain' | 'gain'), goalRateKgPerWeek, language ('mk' | 'en'),
  ringMode ('eaten' | 'left'), targetOverrides (JSON, optional).
- **foods**: id, nameMk, nameEn, searchKey, kind ('ingredient' | 'dish' | 'product' | 'recipe'),
  per 100g: kcal, protein, carbs, fat, fiber, sugar, salt (all nullable — null means
  unknown, never show it as 0), source ('usda' | 'seed' | 'user'), sourceRef (USDA fdcId),
  basedOnFoodId (clone of a seed dish), isEstimate (bool), cookedWeightG (recipes only).
- **portions**: id, foodId, nameMk, nameEn, grams. ("1 парче бурек" = 180 g)
- **recipeIngredients**: id, recipeFoodId, ingredientFoodId, grams.
- **meals**: id, nameMk, nameEn, sortOrder, isDefault, isHidden.
  Seeded: Појадок/Breakfast, Ручек/Lunch, Вечера/Dinner, Ужина/Snacks. User can rename, reorder, add, hide.
- **logEntries**: id, date ('YYYY-MM-DD', local time), mealId, foodId, grams,
  portionId (nullable), quantity (nullable), plus a SNAPSHOT of kcal, protein, carbs,
  fat, fiber, sugar, salt for the logged amount.
  Snapshots are intentional: editing a food or recipe must NEVER change past entries.
- **foods_fts**: FTS5 virtual table over nameMk, nameEn, searchKey.

## Core logic

### Recipe nutrition (`src/lib/recipe.ts`)
Sum each ingredient's nutrients for its grams. If `cookedWeightG` is set, per-100g
values = total ÷ cookedWeightG × 100 (accounts for water loss/gain in cooking).
Otherwise use the sum of raw ingredient weights. If any ingredient has null for a
nutrient, the recipe's value for that nutrient is flagged incomplete in the UI.
Recompute and store per-100g values on the recipe's food row every time it is saved.

### Targets (`src/lib/targets.ts`)
- BMR: Mifflin-St Jeor. Male: 10·kg + 6.25·cm − 5·age + 5. Female: same − 161.
- TDEE = BMR × activity (1.2, 1.375, 1.55, 1.725, 1.9).
- Goal: ± (rate kg/week × 7700 / 7) kcal/day. Max rate 1 kg/week.
- Safety: never suggest a target below 1500 kcal (male) / 1200 kcal (female);
  if the goal would go lower, clamp and show an explanation.
- Protein: 1.6 g/kg body weight (editable). Fat: 30% of kcal. Carbs: remainder.
- Fiber: minimum 14 g per 1000 kcal. Sugar: limit 10% of kcal. Salt: limit 5 g.
- Manual overrides in profile take precedence.

### Search & transliteration (`src/lib/translit.ts`)
`toSearchKey(text)` produces a plain lowercase ASCII key so that "тавче", "tavče",
"tavche" and "tavce" all match:
1. Macedonian Cyrillic → Latin: а a, б b, в v, г g, д d, ѓ g, е e, ж z, з z, ѕ dz,
   и i, ј j, к k, л l, љ lj, м m, н n, њ nj, о o, п p, р r, с s, т t, ќ k, у u,
   ф f, х h, ц c, ч c, џ dz, ш s.
2. Strip diacritics (č→c, š→s, ž→z, ǵ/ѓ→g, ḱ/ć→k, đ→dj).
3. Collapse digraphs: dzh→dz, zh→z, ch→c, sh→s, kj→k, gj→g.
4. Lowercase, trim, collapse whitespace.
Apply the same function to stored names and to the user's query.
Ranking: user foods and recently used first, then seed dishes, then USDA.

## Seed data

Built by Node scripts in `scripts/seed/`, run on the dev machine (not in the app):
1. USDA FoodData Central: Foundation Foods + SR Legacy only (NOT Branded).
   Keep only the 7 nutrients. Salt = sodium (g) × 2.5. Import USDA household
   portions as `portions` rows.
2. Macedonian names for the ~500 most common cooking ingredients (from a
   reviewed translations JSON file in the repo).
3. Seed Macedonian dishes built as recipes from USDA ingredients, marked
   `isEstimate: true`, each with sensible portions.
4. Output `assets/db/app.db` with the full schema (same Drizzle migrations as the app).
The app opens this prebuilt database on first launch.

## Out of scope for v1
Barcode scanning, weight tracking, favourites/copy-yesterday, water, accounts, sync.
Do not build these unless asked, but don't make choices that block them.
