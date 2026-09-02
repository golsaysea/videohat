# VideoHat Cloud Storage

This project includes a Cloudflare Worker API for saving VideoHat Reels projects to D1 and uploading media assets to R2.

## What Goes Where

- D1: users, project metadata, project JSON payloads, asset records.
- R2: uploaded video/audio/export files and other large binary assets.
- Browser local storage: temporary editor cache and the current lightweight user id.

## First Setup

1. Install dependencies:

```bash
npm install
```

2. Create Cloudflare resources:

```bash
npx wrangler d1 create videohat-db
npx wrangler r2 bucket create videohat-assets
```

3. Copy the D1 `database_id` from the create command into `wrangler.jsonc`.

4. Apply the D1 schema:

```bash
npx wrangler d1 migrations apply videohat-db --local
npx wrangler d1 migrations apply videohat-db --remote
```

5. Run the API locally:

```bash
npx wrangler dev --persist-to .wrangler/state
```

6. If the Worker is separate from the frontend, set:

```bash
VITE_VIDEOHAT_API_BASE=https://your-worker-url
```

Then rebuild the frontend.

## API

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/assets?kind=video&fileName=name.mp4`
- `GET /api/assets?key=r2/object/key`

The current first version uses `X-VideoHat-User` as a lightweight owner id. Replace that with a real auth identity later when login is added.
