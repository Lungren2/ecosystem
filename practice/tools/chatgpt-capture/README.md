# ChatGPT Capture

This is a development-only Chrome DevTools extension for collecting small, sanitized evidence bundles from chatgpt.com.

It exists to answer the compatibility questions in `docs/practice/chatgpt-companion.md` before the production Chrome extension depends on chatgpt.com internals.

The tool does not capture response bodies. It redacts cookies, authorization material, common token fields, visible page text, form values, and likely identifiers before it writes a file.

A capture can still contain private metadata. Inspect it before sharing or committing it.

## Load the extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose Load unpacked.
4. Select `practice/tools/chatgpt-capture/extension`.
5. Open chatgpt.com and then open Chrome DevTools.
6. Open the ChatGPT Capture panel.

Chrome's DevTools network API only knows requests visible to the current DevTools session. If DevTools was opened after page load, reload chatgpt.com before starting a flow.

References:

- https://developer.chrome.com/docs/extensions/reference/api/devtools/network
- https://developer.chrome.com/docs/extensions/reference/api/devtools/inspectedWindow
- https://developer.chrome.com/docs/extensions/reference/api/devtools/panels

## Record one flow

Keep captures narrow. Use one capture for one question.

Suggested first captures:

```text
initial-load
scroll-history
open-conversation
archive-one
search
```

For destructive actions, use a disposable conversation. Do not record `delete-one` against a conversation you care about.

In the DevTools panel:

1. Enter the flow label.
2. Click Start flow.
3. Perform one small action in chatgpt.com.
4. Click Export sanitized capture.
5. Inspect the downloaded `.chatgpt-capture.json` before sharing it.

The Start flow timestamp filters the HAR export. It does not clear Chrome's Network panel.

## Capture format

Each bundle contains:

- capture timestamps and label;
- a privacy manifest describing what the tool removed;
- sanitized DOM structure from the current page;
- HAR entries after the flow start time;
- a summary grouped by request method, host, and route.

The tool preserves request shape where it can do so without preserving user text. JSON request bodies keep keys, booleans, numbers, a small set of protocol-like enum strings, and pseudonymized identifiers. Other strings become `<redacted:text>`.

Response bodies are not requested from Chrome and are removed if they appear in the HAR object.

## Development

The sanitizer has no runtime dependencies.

```bash
pnpm --dir practice/tools/chatgpt-capture test
```

Node can also run the tests directly:

```bash
node --test practice/tools/chatgpt-capture/test/capture-core.test.mjs
```

The first implementation is intentionally evidence-only. It does not archive, delete, export real conversation content, inject controls into chatgpt.com, or call private ChatGPT endpoints.
