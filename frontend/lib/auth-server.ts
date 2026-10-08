import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  secret: process.env.BETTER_AUTH_SECRET || "syntheboard-better-auth-secure-secret-key-32chars",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        return await bcrypt.compare(password, hash);
      },
    },
    sendResetPassword: async ({ user, url }) => {
      console.log(`[Better Auth] Password reset request for ${user.email}`);
      console.log(`[Better Auth] Reset URL: ${url}`);
    },
  },
  user: {
    modelName: "User",
    additionalFields: {
      phone: { type: "string", required: false },
      age: { type: "string", required: false },
      job: { type: "string", required: false },
    },
  },
  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  },
  plugins: [bearer()],
});
