// Keep this function self-contained: the panel serializes it into the inspected tab.
export function sanitizeDomAttribute(rawName, value, sanitizeUrl = () => "[REDACTED]") {
  const name = rawName.toLowerCase();
  const redacted = "[REDACTED]";

  if (/^on/i.test(name) || /^(?:srcdoc|style)$/.test(name)
    || /(?:auth|token|cookie|csrf|xsrf|session|secret|password|api[-_]?key)/i.test(name)) {
    return null;
  }
  if (/(?:^|[-_:])(?:user|account|conversation|message)?[-_:]?id(?:$|[-_:])/i.test(name)) {
    return value ? ":id" : "";
  }
  if (/^(?:aria-label|title|placeholder|alt|value)$/.test(name)) {
    return value ? "TEXT" : "";
  }
  if (/^(?:href|src|action|poster)$/.test(name)) return sanitizeUrl(value);

  // A familiar attribute name alone does not make an arbitrary value safe.
  const structuralValues = {
    role: /^(?:alert|alertdialog|article|banner|button|cell|checkbox|columnheader|combobox|complementary|contentinfo|dialog|document|feed|form|grid|gridcell|group|heading|img|link|list|listbox|listitem|log|main|menu|menubar|menuitem|menuitemcheckbox|menuitemradio|navigation|none|option|presentation|progressbar|radio|radiogroup|region|row|rowgroup|rowheader|scrollbar|search|searchbox|separator|slider|spinbutton|status|switch|tab|table|tablist|tabpanel|textbox|timer|toolbar|tooltip|tree|treegrid|treeitem)$/,
    type: /^(?:button|checkbox|color|date|datetime-local|email|file|hidden|image|month|number|password|radio|range|reset|search|submit|tel|text|time|url|week)$/,
    dir: /^(?:auto|ltr|rtl)$/,
    tabindex: /^(?:-1|0)$/,
    contenteditable: /^(?:|true|false|plaintext-only)$/,
    "aria-hidden": /^(?:true|false)$/,
    "aria-expanded": /^(?:true|false)$/,
    "aria-disabled": /^(?:true|false)$/,
    "aria-selected": /^(?:true|false)$/,
    "aria-checked": /^(?:true|false|mixed)$/,
    "aria-pressed": /^(?:true|false|mixed)$/,
    "aria-busy": /^(?:true|false)$/,
    "aria-modal": /^(?:true|false)$/,
    "aria-multiselectable": /^(?:true|false)$/,
    "aria-readonly": /^(?:true|false)$/,
    "aria-required": /^(?:true|false)$/,
    "aria-live": /^(?:off|polite|assertive)$/,
    "aria-orientation": /^(?:horizontal|vertical)$/,
    "data-state": /^(?:open|closed|checked|unchecked|indeterminate|active|inactive|on|off)$/,
  };
  if (/^(?:checked|disabled|hidden|multiple|readonly|required|selected|inert)$/.test(name)) {
    return "";
  }
  if (Object.hasOwn(structuralValues, name) && structuralValues[name].test(value)) {
    return value;
  }
  return redacted;
}

export function sanitizeDomUrl(raw, currentUrl) {
  const redacted = "[REDACTED]";
  const idLike = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[0-9a-f]{20,}|\d{8,}|[A-Za-z0-9_-]{24,})$/i;
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
  const longToken = /[A-Za-z0-9_-]{24,}/g;

  try {
    const base = new URL(currentUrl);
    const url = new URL(raw, base);

    if (!/^https?:$/.test(url.protocol)) return redacted;
    if (!(url.hostname === "chatgpt.com" || url.hostname.endsWith(".chatgpt.com"))) return redacted;

    url.hash = "";
    url.search = "";
    url.pathname = url.pathname
      .split("/")
      .map((segment) => {
        if (!segment) return segment;
        if (idLike.test(segment)) return ":id";
        return segment.replace(uuid, ":id").replace(longToken, ":id");
      })
      .join("/");

    return url.toString();
  } catch {
    return redacted;
  }
}
