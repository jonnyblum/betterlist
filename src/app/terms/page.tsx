import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Terms & Conditions — BetterList",
  description: "Terms and conditions for using BetterList.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>
          <p className="text-muted mt-2 text-sm">Last updated: April 17, 2026</p>
        </div>

        <div className="prose-like space-y-8 text-[15px] text-foreground leading-relaxed">

          <section>
            <p className="text-muted">
              Please read these Terms &amp; Conditions carefully before using BetterList. By creating an account or
              using our services, you agree to be bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. About BetterList</h2>
            <p className="text-muted">
              BetterList (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;) is a platform that allows licensed healthcare
              providers to curate and share product recommendations with their patients. We are not a
              medical provider, pharmacy, or healthcare facility.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p className="text-muted">
              You must be at least 18 years old to use BetterList. By using the Service, you represent
              that you meet this requirement and have the legal capacity to enter into these terms.
              Healthcare providers who register as clinicians represent that they hold a valid, active
              license to practice in their jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. User Accounts</h2>
            <p className="text-muted">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. Notify us immediately at{" "}
              <a href="mailto:jonny@hey.com" className="underline underline-offset-2 hover:text-foreground">jonny@hey.com</a>{" "}
              if you suspect unauthorized access. We reserve the right to suspend or terminate accounts
              that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Not Medical Advice</h2>
            <p className="text-muted">
              <strong className="text-foreground">Important:</strong> Nothing on BetterList constitutes medical
              advice, diagnosis, or treatment. Product recommendations shared through the platform reflect
              the independent professional judgment of individual healthcare providers, not BetterList.
              Always consult a qualified healthcare professional before starting, stopping, or changing
              any health-related regimen. BetterList is not responsible for outcomes related to the use
              of recommended products.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Provider Responsibilities</h2>
            <p className="text-muted">
              Clinicians using BetterList agree to: (a) only recommend products they believe are
              appropriate for the specific patient; (b) comply with all applicable laws, regulations,
              and professional standards; (c) not use the platform to solicit patients outside an
              established provider-patient relationship; and (d) not receive undisclosed financial
              compensation in exchange for recommendations made through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Prohibited Uses</h2>
            <p className="text-muted mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted">
              <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
              <li>Impersonate any person or entity or misrepresent your credentials</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Transmit spam, malware, or any harmful or disruptive content</li>
              <li>Scrape, crawl, or extract data from the Service without our written permission</li>
              <li>Use the Service to promote products in a deceptive or misleading way</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Third-Party Products</h2>
            <p className="text-muted">
              BetterList may link to or facilitate the purchase of third-party products. We do not
              manufacture, stock, or fulfill these products and are not responsible for their quality,
              safety, availability, or fitness for a particular purpose. Your purchase of any product
              is a transaction between you and the relevant retailer or manufacturer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p className="text-muted">
              All content, design, code, and materials on BetterList are owned by or licensed to us
              and are protected by applicable intellectual property laws. You may not reproduce,
              distribute, or create derivative works without our prior written consent. You retain
              ownership of any content you submit (such as notes to patients) and grant us a limited
              license to use it solely to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-muted">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              express or implied, including but not limited to merchantability, fitness for a particular
              purpose, or non-infringement. We do not warrant that the Service will be uninterrupted,
              error-free, or free of harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-muted">
              To the fullest extent permitted by law, BetterList and its officers, directors, employees,
              and agents shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service, even if advised of the possibility
              of such damages. Our total liability for any claim shall not exceed the amount you paid us
              in the 12 months preceding the claim, or $100, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Indemnification</h2>
            <p className="text-muted">
              You agree to indemnify and hold harmless BetterList and its affiliates from any claims,
              losses, damages, and expenses (including reasonable attorneys&apos; fees) arising from your
              use of the Service, your content, or your violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Termination</h2>
            <p className="text-muted">
              We may suspend or terminate your access to the Service at any time, with or without notice,
              for conduct that we determine violates these terms or is harmful to other users, us, or
              third parties. You may stop using the Service and request account deletion at any time by
              contacting us at{" "}
              <a href="mailto:jonny@hey.com" className="underline underline-offset-2 hover:text-foreground">jonny@hey.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Governing Law</h2>
            <p className="text-muted">
              These terms are governed by and construed in accordance with the laws of the United States
              and the state in which BetterList operates, without regard to conflict of law principles.
              Any disputes shall be resolved exclusively in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">14. Changes to These Terms</h2>
            <p className="text-muted">
              We may update these terms from time to time. We will notify you of material changes by
              updating the date at the top of this page and, where appropriate, by sending a notification
              to your registered email or phone number. Your continued use of the Service after changes
              take effect constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">15. Contact</h2>
            <p className="text-muted">
              If you have questions about these Terms &amp; Conditions, please contact us at{" "}
              <a href="mailto:jonny@hey.com" className="underline underline-offset-2 hover:text-foreground">jonny@hey.com</a>.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-black/[0.06] flex items-center justify-between text-sm text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">BetterList</Link>
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
