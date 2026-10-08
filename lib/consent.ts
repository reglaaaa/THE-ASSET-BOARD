// Bump this date whenever the Terms or Privacy Policy change in a way that
// needs fresh agreement — everyone will be asked to accept again.
export const TERMS_VERSION = "2026-10-08";
export const CONSENT_KEY = "asset_terms_accepted";

export function hasAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.version === TERMS_VERSION;
  } catch {
    return false;
  }
}

export function recordAcceptance() {
  try {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: TERMS_VERSION, at: new Date().toISOString() })
    );
  } catch {
    // If storage is blocked, the notice will simply show again next visit.
  }
}
