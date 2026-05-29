# Deployment

## Frontend on GitHub Pages

The frontend in `apps/web` is static. It can be published directly with GitHub Pages.

Important: GitHub Pages should not contain API keys.

## API Server

For personal use, run the API locally:

```bash
cd apps/api
cp ../../.env.example .env
node src/server.mjs
```

Then open the frontend and keep the API endpoint as:

```text
http://localhost:8787
```

## Later Hosted API Options

The API server can later be adapted for Render, Railway, Fly.io, or a VPS. Store API keys in the host's environment variable settings.

