import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      setHeader: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("auth.sendVerificationCode", () => {
  it("sends verification code for test email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.sendVerificationCode({
      email: "estudiante@absa.edu",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("Código enviado");
  });

  it("rejects invalid email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.sendVerificationCode({
        email: "invalid-email",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});

describe("auth.verifyCode", () => {
  it("verifies test code for test email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.verifyCode({
      email: "estudiante@absa.edu",
      code: "123456",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it("rejects invalid code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.verifyCode({
        email: "estudiante@absa.edu",
        code: "000000",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toContain("inválido");
    }
  });

  it("verifies admin code for admin email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.verifyCode({
      email: "admin@absa.edu",
      code: "123456",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it("sets session cookie on successful verification", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.auth.verifyCode({
      email: "estudiante@absa.edu",
      code: "123456",
    });

    expect(ctx.res.setHeader).toHaveBeenCalled();
    const calls = (ctx.res.setHeader as any).mock.calls;
    const setCookieCall = calls.find((call: any) => call[0] === "Set-Cookie");
    expect(setCookieCall).toBeDefined();
  });
});
