// Keep page scrolling available over fixed ORVUNO chrome while preserving
// independently scrollable dialogs, sidebars and form controls.
function canScroll(element, deltaY) {
  if (!(element instanceof HTMLElement)) return false;
  const style = getComputedStyle(element);
  if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
  if (element.scrollHeight <= element.clientHeight + 1) return false;
  if (deltaY < 0) return element.scrollTop > 0;
  if (deltaY > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  return true;
}

function hasScrollableAncestor(target, deltaY) {
  let element = target instanceof Element ? target : null;
  while (element && element !== document.body && element !== document.documentElement) {
    if (canScroll(element, deltaY)) return true;
    element = element.parentElement;
  }
  return false;
}

function pageDelta(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

export function installGlobalWheelScroll() {
  if (typeof window === 'undefined' || window.__orvunoGlobalWheelScrollInstalled) return false;
  window.__orvunoGlobalWheelScrollInstalled = true;

  window.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || !event.deltaY) return;
    if (hasScrollableAncestor(event.target, event.deltaY)) return;

    const root = document.scrollingElement || document.documentElement;
    const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
    const next = Math.max(0, Math.min(maxScroll, root.scrollTop + pageDelta(event)));
    if (next === root.scrollTop) return;

    event.preventDefault();
    root.scrollTop = next;
  }, { capture: true, passive: false });

  return true;
}

installGlobalWheelScroll();
