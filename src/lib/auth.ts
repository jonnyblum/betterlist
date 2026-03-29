import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role } from "@prisma/client";

const CONSUMER_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "me.com",
  "msn.com",
  "live.com",
]);

function isConsumerEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? CONSUMER_EMAIL_DOMAINS.has(domain) : false;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "BetterList <noreply@betterlist.com>",
      async sendVerificationRequest({ identifier, url }) {
        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(process.env.RESEND_API_KEY);

        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "BetterList <noreply@betterlist.com>",
          to: identifier,
          subject: "Sign in to BetterList",
          html: `
            <!DOCTYPE html>
            <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF9F7; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                  <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">Sign in to BetterList</h1>
                  <p style="color: #6b7280; margin: 0 0 32px; font-size: 16px;">Click the button below to securely sign in.</p>
                  <a href="${url}" style="display: inline-block; background: #1a1a1a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">Sign in to BetterList</a>
                  <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
                </div>
              </body>
            </html>
          `,
        });

        if (error) {
          console.error("[auth] Resend error:", error);
          throw new Error(error.message);
        }
      },
    }),
    Credentials({
      id: "auto-login",
      name: "Auto Login",
      credentials: {
        userId: { label: "User ID", type: "text" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const schema = z.object({
          userId: z.string().min(1),
          token: z.string().min(1),
        });
        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;
        const { userId, token } = parsed.data;
        // Look up one-time auto-login token stored in VerificationToken table
        const record = await db.verificationToken.findFirst({
          where: { identifier: userId, token },
        });
        if (!record || record.expires < new Date()) return null;
        // Delete immediately (one-time use)
        await db.verificationToken.deleteMany({ where: { identifier: userId, token } });
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined };
      },
    }),
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        const schema = z.object({
          phone: z.string().min(10),
          code: z.string().length(6),
        });

        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;

        const { phone, code } = parsed.data;

        // Verify OTP with Twilio
        const twilio = await import("twilio");
        const client = twilio.default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        try {
          const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verificationChecks.create({ to: phone, code });

          if (verification.status !== "approved") return null;

          // Find or create user
          let user = await db.user.findUnique({ where: { phone } });
          if (!user) {
            user = await db.user.create({
              data: { phone, role: "PATIENT" },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;

        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, phone: true, email: true, onboarded: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.onboarded = dbUser.onboarded;

          // Auto-assign CLINICIAN role for non-consumer email domains
          if (
            dbUser.email &&
            !isConsumerEmail(dbUser.email) &&
            dbUser.role === "PATIENT"
          ) {
            await db.user.update({
              where: { id: user.id },
              data: { role: Role.CLINICIAN },
            });
            token.role = "CLINICIAN";
          }
        }
      } else if (trigger === "update") {
        // Called from client after role changes (e.g. post-onboarding)
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, phone: true, onboarded: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.onboarded = dbUser.onboarded;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.phone = token.phone as string | undefined;
        session.user.onboarded = token.onboarded as boolean ?? false;
      }
      return session;
    },
  },
});

// Augment next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: Role;
      phone?: string | null;
      onboarded: boolean;
    };
  }
}
