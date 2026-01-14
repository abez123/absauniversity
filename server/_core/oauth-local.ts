import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { SignJWT } from "jose";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // En producción self-hosted, usar autenticación local por código de verificación
  if (process.env.NODE_ENV === "production") {
    console.log("[Auth] Using local verification code authentication (self-hosted mode)");
    
    // Este endpoint se maneja en routers.ts con el sistema de códigos de verificación
    // No necesitamos OAuth en producción self-hosted
    return;
  }

  // En desarrollo, mantener OAuth de Manus
  console.log("[Auth] Using Manus OAuth (development mode)");
  
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    try {
      const { sdk } = await import("./sdk");
      
      const code = getQueryParam(req, "code");
      const state = getQueryParam(req, "state");

      if (!code || !state) {
        res.status(400).json({ error: "code and state are required" });
        return;
      }

      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
