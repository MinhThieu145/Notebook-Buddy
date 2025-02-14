import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isDemo: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    isDemo: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isDemo: boolean;
  }
}
