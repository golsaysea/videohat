# VideoHat Cloud Storage on Cloudflare Pages

This project uses Cloudflare Pages for the frontend and Pages Functions for the `/api/*` backend.

## What Goes Where

- Pages: Vue frontend and `/api/*` Pages Functions.
- D1: users, project metadata, project JSON payloads, official template JSON payloads, asset records.
- R2: uploaded video/audio/export files and other large binary assets.
- Pages Secret: `ADMIN_TOKEN` for publishing official templates.
- Browser local storage: temporary editor cache and the current lightweight user id.

## Cloudflare Dashboard Setup

1. Open your existing Cloudflare Pages project:

```text
Workers & Pages -> your Pages project
```

2. Add the D1 binding:

```text
Settings -> Bindings -> Add -> D1 database
Variable name: DB
D1 database: videohat-db
```

3. Add the R2 binding:

```text
Settings -> Bindings -> Add -> R2 bucket
Variable name: MEDIA
R2 bucket: media
```

`MEDIA` is used because `ASSETS` is reserved in Pages.

4. Add the admin secret:

```text
Settings -> Variables and Secrets -> Add
Name: ADMIN_TOKEN
Type: Secret / encrypted
Value: your private admin password
```

5. Redeploy the Pages project after changing bindings or secrets.

## First Resource Setup

If you have not created the resources yet, create them once:

```bash
npx wrangler d1 create videohat-db
npx wrangler r2 bucket create media
```

Copy the D1 `database_id` into `wrangler.jsonc`.

Apply the D1 schema:

```bash
npm run db:migrate:remote
```

This applies both migrations in `worker/migrations` and creates:

- `users`
- `projects`
- `assets`
- `templates`

## Local Pages Test

```bash
npm run pages:dev
```

This builds the app and serves it through Cloudflare Pages Functions locally.

## API

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/assets?kind=video&fileName=name.mp4`
- `GET /api/assets?key=r2/object/key`
- `GET /api/templates` reads published official templates for every visitor.
- `POST /api/templates` publishes or updates an official template. Requires `X-VideoHat-Admin-Token` or `Authorization: Bearer <token>` matching `ADMIN_TOKEN`.
- `DELETE /api/templates/:id` deletes an official template. Requires the same admin token.

## Official Template Flow

Visitors open the normal Pages site and can only read published official templates, then apply the template parameters to their own uploaded video and audio.

Admins open the Pages site with `?admin=1`, enter `ADMIN_TOKEN`, tune the current Reels parameters, then click `保存为官方模板`. Template publishing stores styles, text samples, export options, and task parameters in D1. Uploaded local media is intentionally not attached to templates yet, so templates stay reusable for other visitors.

The current first version uses `X-VideoHat-User` as a lightweight owner id. Replace that with a real auth identity later when login is added.
