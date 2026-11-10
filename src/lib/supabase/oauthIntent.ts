/**
 * Remembers which Google button was clicked, so `/auth/callback` can tell
 * "Log in with Google" apart from "Sign up with Google".
 * Set right before the redirect to Google; read and cleared by the callback.
 */
export const OAUTH_INTENT_COOKIE = 'quiver-oauth-intent';

/** `login` = must already have an account; `signup` = may create a new one. */
export type OAuthIntent = 'login' | 'signup';
