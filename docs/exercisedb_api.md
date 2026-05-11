# ExerciseDB API Documentation

**Base URL:** `https://oss.exercisedb.dev/api/v1`

## 1. Dataset Structure (Exercise Object)
Each exercise object contains the following fields:
- `exerciseId`: String (Unique identifier)
- `name`: String (Exercise name)
- `gifUrl`: String (URL to the 180p GIF hosted on `static.exercisedb.dev`)
- `instructions`: String[] (Step-by-step performance guide)
- `bodyParts`: String[] (Primary body parts targeted)
- `targetMuscles`: String[] (Primary muscles targeted)
- `secondaryMuscles`: String[] (Supporting muscles)
- `equipments`: String[] (Required equipment)

## 2. API Endpoints
- **Exercises:**
  - `GET /exercises`: Advanced filtering.
    - **Query Params:** `bodyPart`, `equipment`, `targetMuscle`, `limit`, `offset`.
  - `GET /exercises/search`: Fuzzy matching search.
    - **Query Params:** `search` (term), `threshold` (matching sensitivity).
  - `GET /exercises/bodyparts`: Filter exercises by body part.
  - `GET /exercises/muscles`: Filter exercises by target/secondary muscles.
  - `GET /exercises/equipments`: Filter exercises by equipment.
  - `GET /exercises/{exerciseId}`: Retrieve a specific exercise by its ID.
- **Metadata:**
  - `GET /bodyparts`: List all available body parts.
  - `GET /muscles`: List all available muscles.
  - `GET /equipments`: List all available equipment types.

## 3. Media & Usage Restrictions
- **Format:** All exercise demonstrations are provided in **180p GIF format only**. (No MP4 or videoUrl is returned).
- **Attribution:** Credit to **AscendAPI** is mandatory for any project using this dataset.
- **Allowed Use:** Personal projects, prototypes, educational tools, and non-commercial community apps.
- **Prohibited Use:** Commercial products, SaaS platforms, or any monetized use without a paid RapidAPI plan.
- **Rate Limits:** Strict rate limits are applied to the open-source version.
