# Follow-up items

Things to come back to — not urgent, but don't forget.

## Debugging instrumentation pattern

When something breaks in a way that's hard to trace (wrong renders, unexpected saves, event handlers firing in the wrong order), use temporary `console.trace()` wrappers to find the cause fast.

The idea: wrap the function you suspect is misbehaving so it logs its full call stack every time it's called. Drop it in, reproduce the problem in DevTools (Ctrl+Shift+I), read the trace, remove the wrapper.

```javascript
// Example: find what's triggering render() unexpectedly
const _render = render;
window.render = function(...args) {
  console.trace('render() called from:');
  return _render(...args);
};

// Same pattern works for sv(), or any other function
const _sv = sv;
window.sv = function(...args) {
  console.trace('sv() called from:');
  return _sv(...args);
};
```

This is the plain-JS equivalent of React's useEffect dependency debugging. Don't add it permanently — it's a temporary diagnostic tool. The pattern is: instrument → reproduce → read the stack → remove.

This came up when learning about React DevTools Profiler workflows. The same thinking applies here even without React: isolate the thing firing too often, log why it fired, trace backward to the real cause.

## Manual feature verification after SQLite switch

The automated tests cover the core daily loop, but these features touch data deeply and haven't been manually verified since the localStorage → SQLite switch:

- **Grid edit** — open Entries tab, click grid edit, change a value, save, confirm it persists after restart
- **Import/export JSON** — export your data, check the file looks right, reimport it
- **Auto-suggest** — type a description you've used before, confirm suggestions appear
- **Gap detection** — check that time gaps are still flagged between entries
- **Dismissed gaps** — dismiss a gap, restart the app, confirm it stays dismissed

Not urgent — app is tested and working. Do this before any significant new feature work.

---

## Design philosophy review
The DESIGN-PHILOSOPHY.md was recovered from the qa branch and needs a proper review session with Kim. Some of it is off. Go through it section by section and rewrite it to reflect what the app actually is and what Kim actually wants from it. Don't do this unilaterally — it needs to be a conversation.
