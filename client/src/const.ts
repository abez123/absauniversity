export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Validar que las variables de entorno estén configuradas
  if (!oauthPortalUrl || !appId) {
    console.error('Missing OAuth configuration:', { oauthPortalUrl, appId });
    throw new Error('OAuth configuration is missing. Please check your environment variables.');
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Asegurar que oauthPortalUrl sea una URL válida
  let baseUrl = oauthPortalUrl;
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  try {
    const url = new URL(`${baseUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error('Invalid OAuth URL:', { baseUrl, error });
    throw new Error(`Invalid OAuth portal URL: ${baseUrl}`);
  }
};
