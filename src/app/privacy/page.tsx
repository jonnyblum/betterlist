import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Privacy Policy — BetterList",
  description: "How BetterList collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted mt-2 text-sm">Last updated: April 17, 2026</p>
        </div>

        <div className="space-y-8 text-[15px] text-foreground leading-relaxed">

          <section>
            <p className="text-muted">
              BetterList (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This policy
              explains what information we collect, how we use it, and the choices you have. By using
              BetterList you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-muted mb-3"><strong className="text-foreground">Information you provide:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted mb-4">
              <li><strong className="text-foreground">Account information</strong> — name, email address, and/or phone number when you create an account or sign in</li>
              <li><strong className="text-foreground">Profile information</strong> — for clinicians: display name, specialty, practice name, and profile photo</li>
              <li><strong className="text-foreground">Content you submit</strong> — notes attached to recommendations, product selections</li>
              <li><strong className="text-foreground">Communications</strong> — messages you send to us for support</li>
            </ul>
            <p className="text-muted mb-3"><strong className="text-foreground">Information collected automatically:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted">
              <li><strong className="text-foreground">Usage data</strong> — pages visited, features used, and actions taken within the Service</li>
              <li><strong className="text-foreground">Device and log data</strong> — IP address, browser type, operating system, and referring URLs</li>
              <li><strong className="text-foreground">Cookies and similar technologies</strong> — session tokens and authentication cookies required for the Service to function (see Section 7)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted">
              <li>Provide, operate, and improve the Service</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Deliver product recommendations from providers to patients via SMS or email</li>
              <li>Send transactional messages (verification codes, recommendation notifications, reminders)</li>
              <li>Respond to your support requests</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted mt-3">
              We do not sell your personal information to third parties. We do not use your information
              to send marketing messages without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Share Your Information</h2>
            <p className="text-muted mb-3">
              We share information only as necessary to provide the Service or as required by law:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>
                <strong className="text-foreground">Between providers and patients</strong> — when a clinician sends a recommendation,
                their display name and the product list are shared with the patient recipient.
              </li>
              <li>
                <strong className="text-foreground">Service providers</strong> — we use trusted third-party vendors to operate the Service,
                including Twilio (SMS delivery), Resend (email delivery), and cloud infrastructure providers.
                These vendors process data only on our behalf and under confidentiality obligations.
              </li>
              <li>
                <strong className="text-foreground">Legal requirements</strong> — we may disclose information if required by law, court order,
                or to protect the rights and safety of our users or the public.
              </li>
              <li>
                <strong className="text-foreground">Business transfers</strong> — in the event of a merger, acquisition, or sale of assets,
                your information may be transferred as part of that transaction. We will notify you
                before your data is subject to a different privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Retention</h2>
            <p className="text-muted">
              We retain your personal information for as long as your account is active or as needed to
              provide the Service. Recommendation records are retained to allow both providers and patients
              to reference their history. You may request deletion of your account and associated data
              at any time (see Section 6). Some information may be retained longer where required by
              law or for legitimate business purposes such as fraud prevention.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
            <p className="text-muted">
              We use industry-standard security measures including encrypted connections (HTTPS/TLS),
              hashed authentication tokens, and access controls to protect your data. One-time
              verification codes are short-lived and rate-limited. However, no method of transmission
              or storage is 100% secure, and we cannot guarantee absolute security. Please use a strong,
              unique password and keep your account credentials private.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights and Choices</h2>
            <p className="text-muted mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted mb-3">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal information we hold about you</li>
              <li><strong className="text-foreground">Correction</strong> — request that we correct inaccurate or incomplete information</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and personal data</li>
              <li><strong className="text-foreground">Portability</strong> — request your data in a structured, machine-readable format</li>
              <li><strong className="text-foreground">Opt-out of communications</strong> — unsubscribe from non-essential messages at any time</li>
            </ul>
            <p className="text-muted">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:jonny@hey.com" className="underline underline-offset-2 hover:text-foreground">jonny@hey.com</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies</h2>
            <p className="text-muted">
              We use strictly necessary cookies to authenticate sessions and keep you signed in. We do
              not use advertising or tracking cookies. You can configure your browser to block or delete
              cookies, but doing so may prevent you from signing in or using the Service properly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-muted">
              BetterList is not directed to children under 18. We do not knowingly collect personal
              information from anyone under 18. If you believe a minor has provided us with personal
              information, please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Healthcare Data Notice</h2>
            <p className="text-muted">
              BetterList is a product recommendation tool, not a covered entity under HIPAA. Product
              recommendations shared through the platform may constitute health-related information.
              Healthcare providers using BetterList are responsible for ensuring their use of the
              platform complies with applicable healthcare privacy regulations in their jurisdiction,
              including but not limited to HIPAA where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="text-muted">
              We may update this Privacy Policy periodically. We will notify you of material changes
              by updating the date at the top of this page and, where appropriate, by sending a
              notification to your registered contact. Your continued use of the Service after an
              update constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact</h2>
            <p className="text-muted">
              If you have questions, concerns, or requests regarding this Privacy Policy or your
              personal data, please contact us at{" "}
              <a href="mailto:jonny@hey.com" className="underline underline-offset-2 hover:text-foreground">jonny@hey.com</a>.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-black/[0.06] flex items-center justify-between text-sm text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">BetterList</Link>
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
        </div>
      </div>
    </div>
  );
}
