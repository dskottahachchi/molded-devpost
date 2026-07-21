# Molded

**Turn a real product workflow into an interactive demo that captures buyer intent.**

Molded uses a Chrome extension and [rrweb](https://www.rrweb.io/) to capture a real browser session. In the Studio, you can add click targets and guided steps, then publish a shareable demo with an optional lead-capture handoff.

## Judge quick start

**You only need Node.js 20+ and Google Chrome.** No database account or API key is required for the core demo.

1. Open a terminal in this project folder.
2. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000), then select **Explore the dashboard**.
4. In the dashboard, select **New capture**. Download and unzip **Molded Recorder** from the setup page.
5. In Chrome, open `chrome://extensions`:
   - turn on **Developer mode**;
   - select **Load unpacked**;
   - select the unzipped `Molded-Recorder` folder.
6. Open any normal `http://` or `https://` product page in Chrome. Click the **Molded Recorder** extension icon, then select **Start recording**.
7. Click through a short product workflow, then reopen the extension and select **Stop & save recording**.
8. Return to the Molded dashboard and refresh if needed. Open the new card with **Continue** to enter the Studio.

> Chrome does not allow extensions to capture `chrome://` pages, the Chrome Web Store, or other restricted tabs. Use a normal website instead.

## Demo flow for judging

1. **Capture** — record a real browser tab with the Chrome extension.
2. **Shape** — in the Studio, drag and resize click targets, write the buyer prompt, and lock each target in place.
3. **Preview** — open the demo in its buyer-facing interactive mode and click through the guided path.
4. **Publish** — select **Publish demo**, then copy the generated sharing or embed snippet.
5. **Capture intent** — complete the buyer handoff form to see the lead appear under **Buyer signals**.

### What the judges should look for

- The recording is actual rrweb session data, rather than a scripted mockup.
- The Studio converts it into a guided click path with editable spotlight targets.
- The public demo can be explored as an interactive product experience.
- Publishing exposes a share link and an embeddable widget pattern.
- The optional buyer handoff provides a sales-ready intent signal.

## Local data and reset

Molded works locally out of the box. Recordings, demo settings, and buyer signals are stored in the app's local data store so the recorder can send data directly to `http://localhost:3000`.

- Keep `npm run dev` running while recording.
- A capture can take a few seconds to appear because rrweb uploads events in batches.
- To start fresh during a demo, delete draft/published demos from the dashboard controls, or remove the local data file created in the project’s `.data` directory while the app is stopped.

## Optional AI tour suggestions

Molded works without an API key: its tour action uses a local fallback path. To enable OpenAI-powered tour suggestions, create `.env.local` from the example and add your own key:

```bash
cp .env.example .env.local
```

```dotenv
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6
```

Restart `npm run dev` after changing environment variables. Never put an API key in the Chrome extension or in client-side code.

## Optional Supabase persistence

Supabase is not needed for judging locally. It is only needed when you want recordings to survive outside the local app environment.

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL editor.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
4. Restart Molded.

The service-role key is server-only: do **not** add it to the Chrome extension, embed code, or a public repository. For a deployed version, also use a separate ingestion key and configure the extension to send that key to your backend.

## Development commands

```bash
npm run dev          # start Molded at http://localhost:3000
npx tsc --noEmit     # type-check
npm run build        # production build
npm test             # run tests
```

### Rebuilding the extension manually

The app serves a ready-to-download recorder zip at `/Molded-Recorder.zip`. If you change extension source code, rebuild it and reload the unpacked extension in Chrome:

```bash
cd chrome-extension
npm install
npm run build
```

Then select the refresh icon for Molded Recorder on `chrome://extensions`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Demo library |
| `/capture` | Chrome extension setup and download |
| `/studio/:id` | Guided-demo Studio |
| `/demo/:id` | Buyer-facing interactive demo |
| `/signals` | Buyer intent signals |

