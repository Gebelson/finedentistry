import { APIError, type CollectionConfig, type Access } from "payload";
import { persistAuthenticatedSession, renewPersistentCookie, SESSION_COOKIE_SECONDS } from "./persistent-session";

const administrator: Access = ({ req }) => req.user?.role === "admin";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Team member", plural: "Team members" },
  admin: { useAsTitle: "name", defaultColumns: ["name", "email", "role"] },
  auth: {
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: false },
    // Cookie lifetime only. Supported hooks issue revocable tokens without an expiry claim.
    tokenExpiration: SESSION_COOKIE_SECONDS,
    useSessions: true,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  access: {
    admin: ({ req }) => !!req.user,
    create: administrator,
    read: ({ req }) =>
      req.user?.role === "admin" ||
      (req.user ? { id: { equals: req.user.id } } : false),
    update: administrator,
    delete: administrator,
    unlock: administrator,
  },
  hooks: {
    afterOperation: [persistAuthenticatedSession],
    afterMe: [renewPersistentCookie],
    beforeChange: [
      ({ data, originalDoc, req }) => {
        const privateLocalSetup = req.context.bootstrapAdmin === true && process.env.DATABASE_URI?.startsWith('file:');
        if (data.password && data.password.length < (privateLocalSetup ? 8 : 14))
          throw new APIError(
            "Use a password with at least 14 characters.",
            400,
          );
        if (
          originalDoc &&
          String(req.user?.id) === String(originalDoc.id) &&
          data.role &&
          data.role !== "admin"
        ) {
          throw new APIError(
            "You cannot remove your own administrator permissions.",
            400,
          );
        }
        return data;
      },
    ],
    beforeOperation: [
      ({ operation, req }) => {
        if (
          operation === "create" &&
          req.user?.role !== "admin" &&
          req.context.bootstrapAdmin !== true
        ) {
          throw new APIError(
            "Account creation is restricted to an administrator.",
            403,
          );
        }
        if (operation === "forgotPassword") {
          throw new APIError(
            "Password recovery is not configured. Contact your administrator.",
            503,
          );
        }
      },
    ],
    beforeDelete: [
      ({ id, req }) => {
        if (String(req.user?.id) === String(id))
          throw new APIError("You cannot delete your own account.", 400);
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "reception",
      saveToJWT: true,
      options: [
        { label: "Administrator", value: "admin" },
        { label: "Content editor", value: "editor" },
        { label: "Reception", value: "reception" },
      ],
      admin: {
        description:
          "Permissions are checked by the server. Only administrators manage team accounts.",
      },
    },
  ],
};
