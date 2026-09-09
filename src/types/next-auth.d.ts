import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SCHOLAR" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "SCHOLAR" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SCHOLAR" | "ADMIN";
  }
}
