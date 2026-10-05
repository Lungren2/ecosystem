# Documentation

This directory is the durable project model for Ecosystem.

The README gives the short version. These documents hold the distinctions, current directions, historical ideas, and open questions that are too important to leave in chat history.

## Status language

Use these labels when a document mixes ideas at different levels of commitment.

- Current direction: the design we should preserve unless a later decision changes it.
- Historical: an earlier design that still explains where an idea came from.
- Reference: a product, prototype, paper, or implementation used to explain a behavior. A reference is not a requirement to copy the source.
- Open question: a decision that has not been made.

Do not silently turn an open question into architecture.

## Project documents

- [Ecosystem architecture](./ecosystem/architecture.md) records the runtime and cognition model.
- [Ecosystem interface](./ecosystem/interface.md) records the desktop shell, spatial workplane, messaging model, and keyboard-navigation direction.
- [Desktop foundation](./ecosystem/desktop.md) records the Code OSS fork, ProjectSession lifecycle, and upstream-workbench policy.
- [Practice](./practice/README.md) records the shift from the old Agent Context Framework runtime toward an OpenAI-native plugin marketplace with durable teaching and semantic adaptation.
- [ChatGPT companion](./practice/chatgpt-companion.md) records the Chrome extension and Codex Control MCP split, conversation-management features, and compatibility boundaries.
- [Interface](./interface/README.md) records the source-owned UI system intended to make model-authored frontend work conform to the product's actual interface language.
- [Open questions](./open-questions.md) keeps unresolved choices visible without making them accidental contracts.

## Source material

The first version of these documents was reconstructed from the September 2026 ACF/Eco design conversations, the supplied Ecosystem architecture notes, the Frontend Lib proposal, the current ACF repository, UI reference images, and the older Monaco/Tauri prototype.

The raw conversation scrape is not committed as product documentation. It contains exploratory wording, repeated interpretations, and attachments that are better represented by the project documents above. Where later discussion sharpened an earlier idea, these docs record both the current direction and the historical wording when the difference matters.
