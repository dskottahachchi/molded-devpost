# Molded Recorder Chrome extension

The normal judge flow is to download `Molded-Recorder.zip` from Molded’s **New capture** page. Unzip it, then load that folder in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Select the unzipped `Molded-Recorder` folder.
5. Open a normal `http://` or `https://` tab, click the Molded icon, and choose **Start recording**.
6. Reopen the icon when finished and choose **Stop & save recording**.

Chrome blocks extension injection on internal Chrome pages and the Chrome Web Store.

## Development only

If you edit this extension source, rebuild before using **Load unpacked**:

```bash
npm install
npm run build
```

After each rebuild, use the refresh icon for Molded Recorder on `chrome://extensions`.

The recorder masks text, email, telephone, textarea, and password inputs. Add the `prism-block` class to an element to omit it from capture entirely.
