# Molded

**Turn a real product workflow into a guided interactive demo that captures buyer intent.**

Molded lets a founder or sales team record a real browser workflow, shape it into a buyer-controlled guided path, and publish it as an interactive demo. The aim is to let prospects experience the product before they book a meeting or create an account.

## Judge quick start

You only need **Node.js 20+** and **Google Chrome**. No database account or API key is required for the core local demo.

1. Open a terminal in this project folder.
2. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

3. Visit [http://localhost:3000](http://localhost:3000) and select **Explore the dashboard**.
4. Choose **New capture**, then download and unzip **Molded Recorder**.
5. Open `chrome://extensions` in Chrome:
   - turn on **Developer mode**;
   - select **Load unpacked**;
   - choose the unzipped `Molded-Recorder` folder.
6. Open an `http://` or `https://` product page. Click the **Molded Recorder** extension icon, then choose **Start recording**.
7. Click through a short workflow, reopen the extension, and choose **Stop & save recording**.
8. Return to Molded, open the new card with **Continue**, and use the Studio to shape the guided demo.

> Chrome blocks extension capture on `chrome://` pages, the Chrome Web Store, and other restricted tabs. Use a normal website instead.

## Product flow

1. **Capture** — record a genuine browser session with the Chrome extension and rrweb.
2. **Shape** — use the Studio to drag, resize, and lock click targets; add buyer-facing prompts to each step.
3. **Preview** — explore the guided demo in its interactive buyer mode.
4. **Publish** — generate a sharing link and embed pattern for a website.
5. **Capture intent** — use the buyer handoff form to turn a completed exploration into a sales signal.

## How Codex and GPT-5.6 were used

### Codex & GPT-5.6

Codex was used as a development collaborator throughout the project. It accelerated implementation of the TanStack Start application, the Manifest V3 Chrome extension, rrweb replay integration, recording persistence, and the responsive visual system across the landing page, dashboard, Studio, and buyer-facing demo.

It was particularly helpful for iterating quickly on interaction details: reliable start/stop recording behavior, replay sizing, draggable and lockable spotlight targets, and the capture-to-dashboard data flow. Product direction, visual decisions, and the final interaction design were intentionally driven and reviewed by the builder.

## Local data and reset

Molded works locally out of the box. Recordings and demo settings are saved in the project’s local data store, allowing the Chrome recorder to send captures directly to `http://localhost:3000`.

- Keep `npm run dev` running while recording.
- A capture can take a few seconds to appear because rrweb uploads events in batches.
- To reset the local demo, delete demo records from the dashboard controls or remove `.data/molded-recordings.json` while the app is stopped.

## Optional OpenAI setup

Create `.env.local` from the example if you want to enable AI tour suggestions:

```bash
cp .env.example .env.local
```

```dotenv
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6
```

Restart the dev server after changing environment variables. Never expose API keys in the Chrome extension, embed code, or client-side source.

## Optional Supabase persistence

Supabase is optional for local judging. The project already has a local persistence fallback, so judges running the code locally do **not** need a Supabase account or credentials.

For a hosted judge link, configure Supabase once in your own deployment environment. Everyone using that deployed link can then record and view demos without setting up Supabase themselves.

Use the following steps only if you are deploying your own cloud-backed instance:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL editor.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
4. Restart Molded.

The Supabase service-role key is server-only and must never be added to the extension, a public repository, the README, or shared with judges. Put it only in your hosting provider’s private environment-variable settings.

## Development commands

```bash
npm run dev          # start Molded at http://localhost:3000
npx tsc --noEmit     # type-check
npm run build        # production build
npm test             # run tests
```

### Rebuilding the extension

The app serves a ready-to-download recorder at `/Molded-Recorder.zip`. If you edit the extension source:

```bash
cd chrome-extension
npm install
npm run build
```

Then use the refresh icon for Molded Recorder on `chrome://extensions`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Demo library |
| `/capture` | Chrome extension setup and download |
| `/studio/:id` | Guided-demo Studio |
| `/demo/:id` | Buyer-facing interactive demo |
| `/signals` | Buyer intent signals |
