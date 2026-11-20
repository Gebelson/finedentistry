import { decodeJwt, decodeProtectedHeader, SignJWT } from "jose";
import type {
  CollectionAfterMeHook,
  CollectionAfterOperationHook,
} from "payload";
import type { User } from "./payload-types";

// Browsers impose their own retention limits. Renew the cookie on authenticated visits.
export const SESSION_COOKIE_SECONDS = 400 * 24 * 60 * 60;
// Payload requires a date for session bookkeeping. Persistent sessions have no idle deadline.
const PERSISTENT_SESSION_DATE = "9999-12-31T23:59:59.000Z";

export const persistAuthenticatedSession: CollectionAfterOperationHook =
  async ({ operation, result, req }) => {
    if (operation !== "login" && operation !== "refresh") return result;
    if (!result || typeof result !== "object" || !("user" in result))
      return result;
    const tokenKey = operation === "login" ? "token" : "refreshedToken";
    const token =
      tokenKey === "token" && "token" in result
        ? result.token
        : "refreshedToken" in result
          ? result.refreshedToken
          : undefined;
    if (typeof token !== "string") return result;
    // This token has just been issued by Payload after its password/session checks.
    const claims = decodeJwt(token);
    if (
      typeof claims.sid !== "string" ||
      (typeof claims.id !== "number" && typeof claims.id !== "string")
    )
      throw new Error("Persistent login requires a revocable server session.");
    const user = await req.payload.db.findOne<User>({
      collection: "users",
      req,
      where: { id: { equals: claims.id } },
    });
    if (
      !user?.sessions?.some(
        (session: { id: string }) => session.id === claims.sid,
      )
    )
      throw new Error("The authenticated session is unavailable.");
    await req.payload.db.updateOne({
      collection: "users",
      id: user.id,
      req,
      data: {
        sessions: user.sessions.map((session: { id: string }) =>
          session.id === claims.sid
            ? { ...session, expiresAt: PERSISTENT_SESSION_DATE }
            : session,
        ),
        updatedAt: null,
      },
    });
    delete claims.exp;
    const header = decodeProtectedHeader(token);
    if (header.alg !== "HS256")
      throw new Error("Unexpected authentication signing algorithm.");
    const persistentToken = await new SignJWT(claims)
      .setProtectedHeader({ ...header, alg: header.alg, b64: undefined })
      .sign(new TextEncoder().encode(req.payload.secret));
    return { ...result, exp: undefined, [tokenKey]: persistentToken };
  };

export const renewPersistentCookie: CollectionAfterMeHook = ({
  req,
  response,
}) => {
  if (
    !response ||
    typeof response !== "object" ||
    !("user" in response) ||
    !response.user ||
    !("token" in response) ||
    typeof response.token !== "string" ||
    decodeJwt(response.token).exp !== undefined
  )
    return response;
  req.responseHeaders ??= new Headers();
  req.responseHeaders.append(
    "Set-Cookie",
    [
      `${req.payload.config.cookiePrefix}-token=${response.token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${SESSION_COOKIE_SECONDS}`,
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; "),
  );
  return response;
};
