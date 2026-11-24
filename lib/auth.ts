import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins/jwt";
import { getDb } from "./db";

function getBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "http://localhost:3000";
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(getDb(), { transaction: false }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {}),
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "customer", required: false },
      roleSelected: { type: "boolean", defaultValue: false, required: false },
      isBlocked: { type: "boolean", defaultValue: false, required: false },
      businessName: { type: "string", required: false },
      phone: { type: "string", required: false },
      subscriptionPlan: { type: "string", defaultValue: "free", required: false },
      subscriptionExpiresAt: { type: "date", required: false },
      stripeCustomerId: { type: "string", required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role =
            user.role === "vendor" || user.role === "admin" ? user.role : "customer";
          return {
            data: {
              ...user,
              role,
              roleSelected: Boolean(user.roleSelected) || role !== "customer",
              isBlocked: false,
              subscriptionPlan: "free",
            },
          };
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const db = getDb();
          const userRow = await db
            .collection("user")
            .findOne<{ isBlocked?: boolean }>({ _id: session.userId as never });
          if (userRow?.isBlocked) return false;
        },
      },
    },
  },
  plugins: [jwt(), nextCookies()],
});
