# squad-room API

Local API gateway for Squad Room.

```bash
cp ../../.env.example .env
node src/server.mjs
```

The server runs at `http://localhost:8787` by default.

If `OPENAI_API_KEY` is empty, the API automatically uses mock mode.

Set `SQUAD_ROOM_MOCK=true` to force mock mode even when a provider key is configured.
