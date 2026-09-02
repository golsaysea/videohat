# VideoHat Cloud Storage

This project includes a Cloudflare Worker API for saving VideoHat Reels projects to D1 and uploading media assets to R2.

## What Goes Where

- D1: users, project metadata, project JSON payloads, official template JSON payloads, asset records.
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

4. Create an admin token for publishing official templates:

```bash
npx wrangler secret put ADMIN_TOKEN
```

5. Apply the D1 schema:

```bash
npx wrangler d1 migrations apply videohat-db --local
npx wrangler d1 migrations apply videohat-db --remote
```

6. Run the API locally:

```bash
npx wrangler dev --persist-to .wrangler/state
```

7. If the Worker is separate from the frontend, set:

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
- `GET /api/templates` reads published official templates for every visitor.
- `POST /api/templates` publishes or updates an official template. Requires `X-VideoHat-Admin-Token` or `Authorization: Bearer <token>` matching the Worker `ADMIN_TOKEN` secret.
- `DELETE /api/templates/:id` deletes an official template. Requires the same admin token.

## Official Template Flow

Visitors open the normal site and can only read published official templates, then apply the template parameters to their own uploaded video and audio.

Admins open the site with `?admin=1`, enter the `ADMIN_TOKEN`, tune the current Reels parameters, then click `保存为官方模板`. Template publishing stores styles, text samples, export options, and task parameters in D1. Uploaded local media is intentionally not attached to templates yet, so templates stay reusable for other visitors.

The current first version uses `X-VideoHat-User` as a lightweight owner id. Replace that with a real auth identity later when login is added.
