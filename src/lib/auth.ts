import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || "github_placeholder",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "github_placeholder",
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "google_placeholder",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "google_placeholder",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        adminCode: { label: "Admin Code", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        // If admin code matches and user isn't already admin, elevate role
        if (credentials.adminCode === "shrekhu67" && user.role !== "ADMIN") {
          await prisma.user.update({
            where: { email: credentials.email },
            data: { role: "ADMIN" },
          });
          user.role = "ADMIN";
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          section: user.section,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.section = user.section;
        token.image = user.image;
      }
      
      // Allow dynamic token updates if needed
      if (trigger === "update" && session) {
        const newName = session.name ?? session.user?.name;
        const newSection = session.section ?? session.user?.section;
        const newImage = session.image ?? session.user?.image;
        return {
          ...token,
          name: newName ?? token.name,
          section: newSection ?? token.section,
          image: newImage ?? token.image,
          picture: newImage ?? token.picture,
        };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.section = token.section;
        session.user.name = token.name;
        session.user.image = token.image || token.picture;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
