# Molded Recorder Chrome extension

## Build and load

```bash
cd chrome-extension
npm install
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this `chrome-extension` directory.

Use the Molded icon on any `http` or `https` tab to start and stop a recording. Sessions remain in extension-local IndexedDB and can be exported as JSON.

The recorder masks all text, email, phone, textarea, and password inputs. Add the `prism-block` class to an element to omit it from capture completely. Chrome blocks extension injection on internal Chrome pages and the Chrome Web Store.
