# Molded — TanStack Start interactive demos

Molded is a full-stack TanStack Start hackathon project for converting product workflows into shareable, guided interactive demos.

## Product flows

- `/` — persisted demo library
- `/capture` — rrweb-ready capture surface with interaction fallback
- `/studio/$id` — editable guided-demo studio and GPT-5.6 tour action
- `/demo/$id` — public interactive product demo
- `/api/generate-tour` — TanStack Start server route; uses `OPENAI_API_KEY` when configured and otherwise returns a safe local tour

## Run it

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. Set `OPENAI_API_KEY` and (optionally) `OPENAI_MODEL` in your deployment environment to enable GPT-generated tours. Use `npm run build` for a production build and `npx tsc --noEmit` for type validation.

The MVP currently uses `localStorage` for client-side demo persistence. Production use should send captured rrweb events to a secured database and protect demo editing with authentication.

## Supabase cloud recordings

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a long `EXTENSION_INGEST_KEY`.
3. Start Molded, then use **Molded cloud sync → Connect** in the extension popup. Enter `http://localhost:3000/api/recordings` and the same ingest key.

The dashboard will surface cloud captures and the **Recording** tab in the studio replays their original rrweb event stream.

## Chrome extension recorder

The separate [chrome-extension](./chrome-extension) folder is a Manifest V3 rrweb recorder. Build and load it unpacked, export a capture as JSON, then use **Import recording** in Molded’s demo library.
