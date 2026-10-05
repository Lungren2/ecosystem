# ChatGPT Capture

This is a development-only Chrome DevTools extension for collecting small, sanitized evidence bundles from chatgpt.com.

It exists to answer the compatibility questions in `docs/practice/chatgpt-companion.md` before the production Chrome extension depends on chatgpt.com internals.

By default the tool does not read response bodies. An opt-in response-shape mode may transiently read JSON responses from four allowlisted conversation GET routes, reduce them immediately to field names, value types, array lengths, optionality, status codes, MIME types, and body-size ranges, then discard the response text. Raw response bodies are never persisted.

The tool does not retain Chrome's raw HAR object. It copies only allowlisted network fields, drops cookies and authentication headers entirely, and redacts common token fields, visible page text, form values, and likely identifiers before it writes a file.

A capture can still contain private metadata. Inspect it before sharing or committing it.

DOM attribute values use a narrow allowlist of roles, input types, direction, focusability, boolean attributes, accessibility state, and styling-related enum values. Unknown values, including arbitrary `data-*`, class names, and accessibility descriptions, become `[REDACTED]` even when short. Class values remain redacted.

The export also contains a styling-target inventory. It records safe `data-*` attribute names with occurrence counts, preserves short enum-like values only for approved styling attributes, and emits candidate selectors for semantic and layout targets. This lets us study what can be targeted without preserving class names or user text.

Known text and identifier attributes keep their text or identifier markers. URL attributes keep sanitized chatgpt.com URLs and redact external destinations. Executable and authentication attributes are removed. DOM comments are emptied.

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
2. Enable **Capture conversation response shapes** only when the flow needs response structure.
3. Click Start flow.
4. Perform one small action in chatgpt.com.
5. Click Export sanitized capture.
6. Inspect the downloaded `.chatgpt-capture.json` before sharing it.

The response-shape setting is frozen when the flow starts. When enabled, Chrome's DevTools `Request.getContent()` is called only for these JSON GET routes:

```text
/backend-api/conversations
/backend-api/conversations/:id
/backend-api/conversations/:id/messages
/backend-api/conversation/:id
```

Other responses are ignored.

The Start flow timestamp filters the HAR export. It does not clear Chrome's Network panel.

For the `initial-load` smoke test, start the flow before reloading the inspected tab, wait for the page to finish loading, and export from the same DevTools panel. Confirm that the downloaded JSON has a DOM tree and nonzero HAR entries, and that `privacy.unknownDomAttributeValuesRedacted`, `privacy.externalDomUrlsRedacted`, `privacy.rawHarRetained === false`, and `privacy.networkFieldsAllowlisted` are true. Inspect the whole JSON for conversation titles or text, email addresses, account metadata, cookies, tokens, and raw identifiers. Keep the capture local unless inspection shows it is suitable to share. A sanitizer unit-test pass does not verify Chrome's DevTools APIs or the download flow.

## Capture format

Each schema-v3 bundle contains:

- capture timestamps and label;
- a privacy manifest describing what the tool removed;
- sanitized DOM structure from the current page;
- a styling-target inventory derived from the live DOM;
- compact, allowlisted HAR metadata after the flow start time;
- optional aggregated response shapes for the allowlisted conversation reads;
- a summary grouped by request method, host, and route.

The tool preserves request shape where it can do so without preserving user text. JSON request bodies keep keys, booleans, numbers, a small set of protocol-like enum strings, and pseudonymized identifiers. Other strings become `<redacted:text>`.

When response-shape mode is off, response bodies are not requested from Chrome. When it is on, matching JSON bodies are read transiently and converted to structural summaries before export. String values are replaced by the type `string`; dynamic-looking object keys are not retained; arrays are sampled with bounded depth and item counts. Response text itself is not written to the bundle.

Raw request and response headers, cookie objects, page metadata, server addresses, and other HAR fields are not copied into the capture. Only Content-Type is retained from request headers.

Response-shape field names are preserved because they are the evidence we need to define the adapter. A backend could theoretically use user-defined object keys, so schema-v3 captures still require manual inspection before sharing.

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


## Evidence learned from schema v3

The first schema-v3 response-shape run confirmed:

- `/backend-api/conversations` returns `items`, `total`, `limit`, and `offset`; sampled pages contained at most 20 items.
- conversation summaries include `id`, `title`, `create_time`, `update_time`, archive state, star state, and several compatibility fields;
- `/backend-api/conversations/:id/messages` returns `messages` plus cursor-based `page_info`;
- a request for ten turns may still contain hundreds of internal message records because tool, reasoning, citation, and connector records are included;
- the direct conversation-window response now reduces successfully and includes conversation metadata, a message window, current node, and cursor-based page information;
- response shapes must be separated by HTTP status because the same endpoint can return both a full success body and a small rate-limit error body.

The same run produced a useful styling inventory while keeping class values redacted. Presence selectors for thread titles, interactive conversation rows, user-message bubbles, assistant messages, app-shell regions, and composer regions are now better candidates than generated class names.

Response-shape failures now include only the failure stage, HTTP status, MIME type, and declared body size. They never include response text.


The recorder groups response-shape records by endpoint kind and HTTP status. This prevents a 429 error body from making fields in the 200 success schema look optional.
