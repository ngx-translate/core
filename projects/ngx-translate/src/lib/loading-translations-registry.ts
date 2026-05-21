import { computed, Signal, signal, WritableSignal } from "@angular/core";
import { Observable } from "rxjs";
import type { InterpolatableTranslationObject, Language } from "./translate.service.interface";

function omit<V>(map: Record<Language, V>, key: Language): Record<Language, V> {
    const next: Record<Language, V> = {};
    for (const k of Object.keys(map)) {
        if (k !== key) next[k] = map[k];
    }
    return next;
}

/**
 * In-flight load registry — one entry per language currently being loaded.
 * Backed by a signal so `isLoading` can derive reactively from its contents.
 *
 * Invariants:
 * - Entries added by `loadAndCompileTranslations` before subscribe.
 * - Entries removed by `loadAndCompileTranslations`'s `tap` on the success
 *   path (synchronously between store update and subscriber notification, so
 *   subscribers observe this language gone from the registry — and
 *   `isLoading()` flips false if no other load is in flight) and by the
 *   `shareReplay`'d Observable's `finalize` for error / sync-throw /
 *   last-subscriber-unsubscribe paths. The success-path finalize is a safe
 *   no-op (idempotent `clearIfOwner`).
 * - Same-language back-to-back loads dedup via the existing `shareReplay`; the
 *   registry stays at one entry per language regardless of subscriber count.
 *   `isLoading` therefore toggles `0 -> 1 -> 0` once per language load, not
 *   once per subscriber. Set-based, not count-based — matches user intent
 *   ("a language is loading" not "N callers asked").
 * - `clearIfOwner(lang, token)` only removes the entry if it still matches the
 *   original Observable token captured at `set()` time. Prevents stale-finalize
 *   races where an old load's `finalize` would clobber a newer load's entry
 *   (e.g. `resetLang` followed by `reloadLang` while the old load is still
 *   mid-flight).
 * - `clear(lang)` is unconditional — used by `resetLang` to forcibly drop
 *   ownership regardless of which load owns the entry.
 *
 * Internal to the package — not re-exported from `public-api.ts`.
 */
export class LoadingTranslationsRegistry {
    private state: WritableSignal<Record<Language, Observable<InterpolatableTranslationObject>>> =
        signal({});

    /** Reactive — `true` while at least one load is in flight. */
    readonly hasAny: Signal<boolean> = computed(() => Object.keys(this.state()).length > 0);

    /** `true` while THIS language is being loaded on this instance. */
    isLoading(lang: Language): boolean {
        return this.state()[lang] !== undefined;
    }

    get(lang: Language): Observable<InterpolatableTranslationObject> | undefined {
        return this.state()[lang];
    }

    set(lang: Language, obs: Observable<InterpolatableTranslationObject>): void {
        this.state.update((m) => ({ ...m, [lang]: obs }));
    }

    /** Unconditional clear. Used by `resetLang` to forcibly drop the entry. */
    clear(lang: Language): void {
        this.state.update((m) => omit(m, lang));
    }

    /**
     * Token-aware clear. Used by `loadAndCompileTranslations`'s `finalize` so
     * an old load's `finalize` cannot clobber a newer load's entry.
     */
    clearIfOwner(lang: Language, token: Observable<InterpolatableTranslationObject>): void {
        this.state.update((m) => (m[lang] === token ? omit(m, lang) : m));
    }
}
