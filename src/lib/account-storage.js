const LEGACY_SENSITIVE_KEYS = [
  "launchSystem",
  "clientMagnetPrefill",
  "ghl_location_id",
  "ghl_verified",
  "ghl_location_name",
  "funnelBuilderState",
  "generatedFunnel",
  "funnelCreatorState",
  "ideaIntakeDraft",
  "launchSystemBeforeMoneyModel",
  "moneyModelHandoff",
  "funnelFormDraft",
];

const ACCOUNT_PREFIX = "mbos:account:";
const ACTIVE_ACCOUNT_KEY = "mbos:active-account";
let activeAccount = "";

const hashIdentity = (value) => {
  let hash = 2166136261;
  const input = String(value || "").trim().toLowerCase();
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const storageAvailable = () => typeof window !== "undefined" && Boolean(window.localStorage);

const removeLegacySharedData = () => {
  if (!storageAvailable()) return;
  LEGACY_SENSITIVE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

const removeOtherAccountCaches = (allowedPrefix) => {
  if (!storageAvailable()) return;
  const removals = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(ACCOUNT_PREFIX) && !key.startsWith(allowedPrefix)) removals.push(key);
  }
  removals.forEach((key) => window.localStorage.removeItem(key));
};

const scopedKey = (key) => activeAccount ? `${ACCOUNT_PREFIX}${activeAccount}:${key}` : "";

export function initializeAccountStorage(user) {
  if (!storageAvailable()) return false;
  const identity = user?.id || user?.email;
  if (!identity) {
    lockAccountStorage();
    return false;
  }

  activeAccount = hashIdentity(identity);
  const allowedPrefix = `${ACCOUNT_PREFIX}${activeAccount}:`;
  removeLegacySharedData();
  removeOtherAccountCaches(allowedPrefix);
  window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, activeAccount);
  return true;
}

export function lockAccountStorage() {
  if (!storageAvailable()) return;
  removeLegacySharedData();
  const removals = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(ACCOUNT_PREFIX)) removals.push(key);
  }
  removals.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  activeAccount = "";
}

export const accountStorage = {
  getItem(key) {
    if (!storageAvailable() || !activeAccount) return null;
    return window.localStorage.getItem(scopedKey(key));
  },
  setItem(key, value) {
    if (!storageAvailable() || !activeAccount) return;
    window.localStorage.setItem(scopedKey(key), String(value));
  },
  removeItem(key) {
    if (!storageAvailable() || !activeAccount) return;
    window.localStorage.removeItem(scopedKey(key));
  },
};
