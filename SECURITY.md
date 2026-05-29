# Security

Squad Room is designed so the static frontend never needs a model provider API key.

## Key Rules

- Do not commit `.env` files.
- Do not put real API keys in `apps/web`.
- Do not expose provider keys through GitHub Pages.
- Keep API keys on the API server only.
- Use mock mode for demos and screenshots.

## Reporting Issues

If you find a security issue, avoid posting real API keys or logs in a public issue. Open a minimal report with reproduction steps and redacted examples.

## Known MVP Limits

- There is no account system yet.
- There is no encrypted database key storage yet.
- Meeting history currently stays in the browser session.
- Usage cost is estimated from provider token fields when available.

