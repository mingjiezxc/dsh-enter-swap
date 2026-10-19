/**
 * Client half of the composer Enter swap.
 *
 * The Conversation composer owns Enter semantics inside its private Lexical
 * keymap: an unmodified Enter submits, Shift+Enter falls through to the
 * editor's line break. That keymap exposes no runtime hook, and the read-only
 * shortcut rows it registers cannot be re-registered by another plugin, so the
 * two gestures are exchanged at the only boundary that is both public and
 * complete: the composer's own DOM keydown.
 *
 * This plugin listens in the capture phase, recognizes an unmodified Enter
 * aimed at the composer's editable host, swallows that event, and re-dispatches
 * the same keydown with `shiftKey` inverted. The composer then takes exactly the
 * mirrored branch: Enter reaches the line-break path and Shift+Enter reaches the
 * submit path, including the configured busy-Enter delivery mode and the
 * command-menu arbitration plain Enter already owns.
 *
 * Everything else is left alone: modified combos (Ctrl/Cmd/Alt+Enter),
 * composition input, other text controls, and the editor-less workspace
 * trigger composer keep their own behavior.
 */
window.__ModuleLoader__.load({
  id: '@major.chen/dsh-enter-swap',
  factory() {
    /** Marks the re-dispatched event so it is never swapped a second time. */
    const SWAPPED = Symbol('dsh-enter-swap:swapped');
    /** The composer's Lexical host: the single editable root this plugin adapts. */
    const COMPOSER_HOST = '[data-composer-input][data-lexical-editor="true"]';
    const ENTER = 'Enter';
    const ENTER_KEY_CODE = 13;

    /**
     * Resolve the composer editable host owning a keydown target.
     * @param target - the event target.
     * @returns the composer host, or null for every other target.
     */
    function composerHost(target) {
      if (!(target instanceof Element)) return null;
      const host = target.closest(COMPOSER_HOST);
      return host instanceof HTMLElement && host.isContentEditable ? host : null;
    }

    /**
     * Report whether an Enter belongs to an in-flight composition rather than to
     * the draft, mirroring the composer's own composition guard.
     * @param event - the original keydown.
     * @param host - the composer host carrying the live composition attribute.
     * @returns true when the keydown must not be swapped.
     */
    function inComposition(event, host) {
      return event.isComposing === true || event.keyCode === 229 || host.hasAttribute('data-composer-composing');
    }

    /**
     * Build the mirrored keydown: the same Enter with `shiftKey` inverted.
     * @param event - the original keydown.
     * @returns an untrusted but well-formed replacement event.
     */
    function mirrored(event) {
      const copy = new KeyboardEvent('keydown', {
        key: ENTER,
        code: ENTER,
        location: event.location,
        ctrlKey: event.ctrlKey,
        shiftKey: !event.shiftKey,
        altKey: false,
        metaKey: event.metaKey,
        repeat: event.repeat,
        isComposing: event.isComposing === true,
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
      });
      try {
        // Legacy mirrors for readers that still consult the deprecated fields;
        // Lexical and the composer resolve the key from `key`.
        Object.defineProperty(copy, 'keyCode', { value: ENTER_KEY_CODE });
        Object.defineProperty(copy, 'which', { value: ENTER_KEY_CODE });
      } catch (_error) {
        // Best effort only: a host that rejects the expando still swaps correctly.
      }
      copy[SWAPPED] = true;
      return copy;
    }

    /**
     * Exchange Enter and Shift+Enter for the composer only.
     * @param event - a document-level keydown captured before its target sees it.
     */
    function onKeyDown(event) {
      if (event[SWAPPED] === true) return;
      if (event.key !== ENTER) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      const host = composerHost(event.target);
      if (host === null || inComposition(event, host)) return;
      event.preventDefault();
      event.stopPropagation();
      host.dispatchEvent(mirrored(event));
    }

    return {
      apply(ctx) {
        ctx.effect(() => {
          document.addEventListener('keydown', onKeyDown, true);
          return () => document.removeEventListener('keydown', onKeyDown, true);
        }, 'dsh-enter-swap: composer Enter exchange');
      },
    };
  },
});
