# Security

Squad Room is designed so the static frontend never needs a model provider API key.

## Key Rules

- Do not commit `.env` files.
- Do not put real API keys in `apps/web`.
- Do not expose provider keys through GitHub Pages.
- Keep API keys on the API server only.
- Use mock mode for demos and screenshots.
- Keep tool activity visible to the user.
- Require explicit user approval before sending a query to a third-party search provider.
- Run low-risk automatic tools only at bounded meeting stages.

## Project Material Imports

- The browser reads only files the user explicitly selects in the Project materials section.
- Imported files are parsed locally in the browser. Extracted text is sent to the configured API server only when the user opens a room.
- TXT-like formats use browser-native reading. PDF, DOCX, XLS, and XLSX imports load parser libraries from jsDelivr on demand; the selected files themselves are not uploaded to jsDelivr.
- Each selected file is limited to 10 MB, and the combined extracted context is limited to 12,000 characters.

## Reporting Issues

If you find a security issue, avoid posting real API keys or logs in a public issue. Open a minimal report with reproduction steps and redacted examples.

## Known MVP Limits

- There is no account system yet.
- There is no encrypted database key storage yet.
- Meeting history currently stays in the browser session.
- Usage cost is estimated from provider token fields when available.
- The MVP tools do not read arbitrary local files or execute code. Project material import reads only files selected by the user.
- Web-search requests send only the visible query to the search provider after the user clicks Approve. Results are added to the in-memory meeting research context.
- Automatic tool activity is bounded to context reading, brief generation, and task generation.
