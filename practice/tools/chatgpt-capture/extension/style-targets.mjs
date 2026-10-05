// Keep both functions self-contained: the panel serializes them into the inspected tab.
export function isStyleTargetAttribute(rawName) {
  const name = String(rawName).toLowerCase();
  if (!/^data-[a-z0-9-]{1,80}$/.test(name)) return false;
  if (/^(?:data-(?:auth|token|cookie|csrf|xsrf|session|secret|password|api-key))/.test(name)) return false;

  return /^(?:data-(?:state|variant|size|color|uniform|pill|appearance|icon-size|gutter-size|optically-align|disabled|theme|reduced-motion))$/.test(name)
    || /^data-app-shell-/.test(name)
    || /^data-app-action-sidebar-/.test(name)
    || name === "data-app-navigation-rail"
    || /^(?:data-thread-title(?:-trigger)?|data-interactive-row-link|data-sidebar-destination|data-user-message-bubble|data-conversation-role|data-selected-text-overlay-target|data-markdown-text-style|data-thread-scroll-footer|data-rich-text-layout|data-floating-chat-surface|data-pip-obstacle|data-quick-chat-drag-handle)$/.test(name)
    || /^data-composer-/.test(name);
}

export function sanitizeStyleTargetValue(rawName, rawValue) {
  const name = String(rawName).toLowerCase();
  const value = String(rawValue ?? "");
  const token = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

  if (!token.test(value)) return null;

  if (/^(?:data-(?:state|variant|size|color|uniform|pill|appearance|icon-size|gutter-size|optically-align|disabled|theme|reduced-motion))$/.test(name)) {
    return value;
  }

  if (/^data-composer-(?:dark|layout|padding-variant|radius-variant|density|surface-overflow|surface-variant|utility-bar-variant|spacing|rows|input-variant|input-layout|dropdown-foreground|dropdown-presentation|dropdown-viewport|footer-collapse)$/.test(name)) {
    return value;
  }

  if (/^data-app-shell-(?:left-panel-appearance|header-placement|header-layout|sidebar-open|page-surface|compact-page-gutter|right-panel-full-width)$/.test(name)) {
    return value;
  }

  if (name === "data-markdown-text-style" || name === "data-conversation-role") return value;
  return null;
}
