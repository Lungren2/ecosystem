# ChatGPT companion

## Current direction

Practice should ship a ChatGPT companion that combines an OpenAI plugin with a Chrome extension.

The two parts have different authority.

The OpenAI plugin owns model-facing behavior and external tools. It can package Practice skills and an MCP server. The browser extension owns changes to the chatgpt.com client experience.

Do not use the MCP server as a browser-control or conversation-scraping backdoor. OpenAI's current plugin guidelines say an MCP server must not pull, reconstruct, or infer the full ChatGPT chat log from the client or elsewhere. It should operate only on content the client or model intentionally sends.

References:

- OpenAI plugin architecture: https://developers.openai.com/plugins/concepts/plugins
- OpenAI MCP plugin guidelines: https://developers.openai.com/plugins/app-guidelines
- Chrome Side Panel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome Split View API: https://developer.chrome.com/blog/split-view-api-extensions

## Product shape

```text
ChatGPT companion
|
+-- OpenAI plugin
|   |
|   +-- Practice skills
|   |
|   +-- Codex Control MCP
|       +-- start_task
|       +-- steer_task
|       +-- inspect_task
|       +-- inspect_diff
|       +-- inspect_checks
|       +-- interrupt_task
|
+-- Chrome extension
    +-- conversation index
    +-- bookmarks
    +-- paginated navigation
    +-- export
    +-- split conversations
    +-- selective bulk archive and delete
    +-- inactivity-based auto archive
```

The plugin and extension may share product identity and configuration, but they should not share authority by accident.

## Codex Control MCP

The MCP side follows the bounded delegation design already discussed for ChatGPT and local Codex.

ChatGPT delegates a bounded engineering task to a local Codex runtime, inspects evidence, and steers the task. Codex keeps ownership of filesystem access, shell execution, sandboxing, and local subagents.

The MCP vocabulary should stay small:

- `list_projects()` and `inspect_project(projectId)`;
- `start_task(projectId, objective, profile)`;
- `steer_task(taskId, instruction)`;
- `inspect_task(taskId)`;
- `inspect_diff(taskId, paths?, cursor?)`;
- `inspect_checks(taskId)`;
- `interrupt_task(taskId)`;
- `continue_task(taskId, instruction)`.

Do not expose generic `shell(command)`, `read_file(path)`, `write_file(path)`, or `codex(prompt)` tools.

The local bridge should expose task state and evidence rather than streaming an entire Codex transcript back into ChatGPT. Useful evidence includes objective, status, final response, changed files, diff, commands executed, check results, errors, and Git heads before and after work.

The first MCP implementation can remain independent of the browser extension. A later bridge between them should require a concrete user workflow.

## Browser extension

The extension is responsible for chatgpt.com-specific interaction changes.

It should isolate all assumptions about ChatGPT's DOM, navigation, or undocumented request behavior behind one compatibility adapter. Product logic for pagination, bookmarks, retention rules, export formatting, and selection should not depend on selectors or private endpoint names.

Conceptually:

```ts
interface ChatGPTConversationAdapter {
  listConversations(input: ConversationQuery): Promise<ConversationPage>;
  readConversation(id: string): Promise<ConversationExportSource>;
  archive(ids: string[]): Promise<BatchResult>;
  delete(ids: string[]): Promise<BatchResult>;
  openConversation(id: string): Promise<void>;
}
```

The exact interface is not frozen. The boundary is.

If chatgpt.com changes, one adapter should fail and be replaced. The rest of the extension should remain testable against stable fixtures.

## Compatibility evidence capture

Before the production extension depends on chatgpt.com internals, collect narrow evidence for the actual flows we need.

The repository includes a development-only Chrome DevTools extension at `practice/tools/chatgpt-capture/`. It records HAR metadata visible to DevTools after a flow start timestamp and a sanitized DOM structure from the inspected page.

The capture tool deliberately does not retrieve response bodies or retain Chrome's raw HAR object. It copies only allowlisted network metadata, drops cookies and authentication headers, and redacts common token fields, visible page text, form values, and likely identifiers before it writes a `.chatgpt-capture.json` file.

DOM values are preserved only for allowlisted structural attributes with constrained values. Unknown attribute values, including short `data-*` values, class names, and free-text accessibility metadata, are redacted. DOM comments are emptied. Known text, identifier, URL, and authentication attributes keep their dedicated redaction rules. The complete capture still requires inspection before sharing.

Initial flow captures should answer one question each:

```text
initial-load
scroll-history
open-conversation
archive-one
search
```

Use disposable conversations for destructive-flow research.

The purpose is to identify the smallest compatibility adapter that can support conversation listing, opening, export, archive, delete, pagination, and inactivity metadata. Captured private endpoints remain compatibility evidence. They do not become stable product contracts merely because they were observed once.

Raw HARs and unsanitized page dumps must not be committed. Sanitized captures should also be inspected before sharing because metadata can still be private.

Chrome's DevTools network API only reports requests visible to the current DevTools session, so reload chatgpt.com after opening DevTools when a complete initial-load capture is required.

## Conversation index

Pagination, bookmarks, bulk selection, and inactivity rules should use an extension-owned index instead of treating ChatGPT's current virtualized sidebar as the product data model.

A minimal local record may look like:

```ts
type ChatIndexEntry = {
  chatId: string;
  url: string;
  title: string;
  lastActivityAt?: string;
  bookmarked: boolean;
  archived: boolean;
  indexedAt: string;
};
```

The index is a convenience projection. ChatGPT remains the source of truth for the conversation itself and whether it is archived or deleted.

The extension must be able to rebuild the index.

## Pagination and bookmarks

The preferred UI is a Chrome side panel available on chatgpt.com.

Chrome's Side Panel API gives extensions a persistent browser-owned panel alongside the page and can scope it to specific sites. That makes it a better owner for a paginated conversation browser than rewriting ChatGPT's current sidebar in place.

The panel should support:

- explicit pages rather than infinite virtualized history;
- stable page size;
- bookmarks;
- filtering and sorting when they have a concrete use;
- multi-select;
- direct navigation to the real ChatGPT conversation.

Bookmarks belong to the extension. They must not mutate the conversation.

## Split conversations

A split conversation means two real ChatGPT threads visible at once.

Do not mount or clone two copies of ChatGPT's application inside one page.

Use real browser tabs. When the Chrome Split View API is available, the extension can pair two adjacent ChatGPT tabs with `tabs.createSplit()`. The API is documented for Chrome 155 and later.

Before that API is available, the fallback is to open and arrange two normal ChatGPT tabs or windows without pretending they are one embedded application.

Each side must keep its own URL, composer, streaming state, scroll position, and ChatGPT lifecycle.

## Export

The extension should support per-conversation export without depending on the account-wide ChatGPT data export flow.

Initial formats:

- Markdown for readable archival and reuse;
- JSON for loss-minimized structured data;
- self-contained HTML when preserving readable presentation is useful.

Export should preserve conversation identity, title, timestamps when available, roles, message order, and attachments or references when the extension can access them safely.

Do not claim an export is lossless unless the adapter can actually observe every relevant field.

## Bulk archive and delete

Bulk operations should be selective. The user chooses the conversations before the extension performs the action.

Archiving is reversible organization. Deletion is destructive and should have stronger friction.

Before deletion, show the exact number of selected conversations and require explicit confirmation. Do not provide an automatic-delete rule as part of the initial product.

Batch operations should report partial failure per conversation instead of turning one failed request into an ambiguous all-or-nothing result.

## Auto archive inactive chats

Auto archive is a local user rule.

Example:

```text
Archive chats after 30 days of inactivity
except when bookmarked
```

The extension should evaluate the rule from its local index and then apply archive actions through the compatibility adapter.

Auto archive must be observable and reversible. Record when the extension archived a conversation and which rule caused it.

Do not turn inactivity into automatic deletion.

## Security and privacy

The browser extension and MCP server have different trust boundaries.

The Chrome extension may observe chatgpt.com because the user explicitly installs it for that site. Keep host permissions narrow and do not extract or persist authentication credentials.

The MCP server must follow OpenAI's plugin data rules. It must not use the browser extension to reconstruct the user's full ChatGPT history for model access.

Browser data should stay local unless a user action explicitly sends selected content elsewhere.

Write actions need accurate labels and user-visible confirmation where the action is destructive or sends data across a boundary.

## Repository ownership

This work belongs to Practice.

Default homes are:

```text
practice/
+-- plugins/
|   +-- chatgpt-companion/       OpenAI plugin package and MCP capability
|
+-- apps/
    +-- chatgpt-extension/       Chrome extension
```

The exact internal plugin package must follow the OpenAI plugin format we implement against. Do not create a parallel custom plugin format.

The browser extension is a separately executable Practice-owned application, so it earns its own app boundary inside the Practice owner.

Shared code should stay inside one of these areas until both applications consume the same named contract. Only then consider a Practice package or a root shared package.

## Initial implementation order

Start by collecting sanitized compatibility evidence with `practice/tools/chatgpt-capture/`. Use those captures to choose the conversation adapter before implementing write operations.

Then build the browser extension as a small local tool and the Codex MCP as a small independent tool.

For the extension, prove:

1. a local conversation index can be built and rebuilt;
2. the side panel can paginate it and bookmark conversations;
3. one conversation can export to Markdown and JSON;
4. selected conversations can be archived with clear result reporting;
5. two real ChatGPT tabs can be opened as a split workflow;
6. an inactivity rule can propose or apply archive actions.

For the MCP, prove the existing Codex Control spike separately with bounded task tools and structured evidence.

Do not block either side on Practice personalization. Durable teaching and semantic reconciliation can be added after the companion has useful behavior.

## Compatibility rule

chatgpt.com is not a stable extension API.

Treat DOM selectors, request formats, and internal routes as compatibility code. Tests should use captured fixtures where possible, and failures should degrade to a clear "ChatGPT compatibility changed" state rather than silently deleting, archiving, or exporting the wrong conversation.
