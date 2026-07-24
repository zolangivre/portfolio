/**
 * sessionStorage keys bridging a language switch's hard reload: written by
 * LanguageSwitcher.tsx right before `window.location.href` navigates away,
 * read once by PageTransition.tsx on the next mount to restore scroll
 * position and play a distinct "the site just translated" entrance instead
 * of the default route-change fade.
 */
export const LANG_TRANSITION_FLAG = 'pt:lang-transition'
export const LANG_TRANSITION_SCROLL_KEY = 'pt:lang-transition-scroll'
