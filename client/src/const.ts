export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const DEFAULT_LOGIN_PATH = "/login";
const OAUTH_PORTAL_URL = import.meta.env.VITE_OAUTH_PORTAL_URL;
const OAUTH_APP_ID = import.meta.env.VITE_APP_ID;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Return login page URL with OAuth fallback
export const getLoginUrl = () => {
  if (!isNonEmptyString(OAUTH_PORTAL_URL) || !isNonEmptyString(OAUTH_APP_ID)) {
    return DEFAULT_LOGIN_PATH;
  }

  try {
    const portalUrl = new URL(OAUTH_PORTAL_URL);
    portalUrl.searchParams.set("appId", OAUTH_APP_ID);
    return portalUrl.toString();
  } catch (error) {
    console.warn("[Auth] Invalid OAuth portal URL, falling back to /login", error);
    return DEFAULT_LOGIN_PATH;
  }
};
