const STORAGE_KEY = "acspot.anonymousId";

export function getAnonymousId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const id = window.crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
