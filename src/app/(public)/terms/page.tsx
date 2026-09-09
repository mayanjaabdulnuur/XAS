import Link from "next/link";

// TODO(Phase 6): pull this from the SiteSetting table so admins can update
// it from the Site Settings panel without a code deploy. Hardcoded for now
// since that admin UI doesn't exist yet.
const LAST_UPDATED = "6 September 2026";

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-white/80 leading-relaxed">
      <article>
        <header className="mb-8">
          <h1 className="text-2xl font-display text-white mb-2">XAS Terms of Use</h1>
          <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
          <p className="text-white/50 text-xs mt-3 italic">
            This page is a plain-language summary of platform rules and is not a substitute
            for legal advice. It does not constitute a binding legal contract review, and XAS
            recommends consulting a qualified professional for legal guidance specific to your
            situation.
          </p>
        </header>

        <section aria-labelledby="acceptance" className="mb-8">
          <h2 id="acceptance" className="text-lg text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By registering for an account or otherwise using Xtream Advanced Scholars
            (&ldquo;XAS&rdquo;), you agree to these Terms of Use. If you do not agree, please do
            not create an account or use the platform.
          </p>
        </section>

        <section aria-labelledby="eligibility" className="mb-8">
          <h2 id="eligibility" className="text-lg text-white mb-2">2. Eligibility and Accounts</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate information when registering.</li>
            <li>You are responsible for your account and for keeping your password confidential.</li>
            <li>One person should not create multiple accounts to bypass platform restrictions.</li>
            <li>You must notify XAS promptly if you suspect unauthorized access to your account.</li>
          </ul>
        </section>

        <section aria-labelledby="purpose" className="mb-8">
          <h2 id="purpose" className="text-lg text-white mb-2">3. Educational Purpose</h2>
          <p className="mb-2">
            XAS is an educational platform intended for O Level and A Level scholars. Resources
            are provided to support legitimate academic study.
          </p>
          <p>
            XAS does not guarantee examination results, grades, or the academic correctness of
            every resource shared on the platform.
          </p>
        </section>

        <section aria-labelledby="uploads" className="mb-8">
          <h2 id="uploads" className="text-lg text-white mb-2">4. User-Uploaded Content</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Scholars may upload educational resources, subject to administrator approval.</li>
            <li>You must have the legal right or permission to share any material you upload.</li>
            <li>
              Uploads must comply with the{" "}
              <Link href="/upload-policy" className="text-xas-gold underline">
                XAS Upload &amp; Copyright Policy
              </Link>
              .
            </li>
            <li>XAS may reject, remove, restrict, or investigate any uploaded content at its discretion.</li>
          </ul>
        </section>

        <section aria-labelledby="prohibited" className="mb-8">
          <h2 id="prohibited" className="text-lg text-white mb-2">5. Prohibited Content and Conduct</h2>
          <p className="mb-2">You must not upload, post, or engage in any of the following:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Copyright infringement or pirated material</li>
            <li>Malware or malicious files</li>
            <li>Pornographic or sexually explicit content</li>
            <li>Hate speech</li>
            <li>Harassment and bullying</li>
            <li>Threats</li>
            <li>Personal or private information belonging to others</li>
            <li>Fraud or impersonation</li>
            <li>Spam and unsolicited advertising</li>
            <li>False or deliberately misleading submissions</li>
            <li>Attempts to bypass premium access restrictions</li>
            <li>Attempts to hack, attack, disrupt, or gain unauthorized access to XAS</li>
          </ul>
        </section>

        <section aria-labelledby="approval" className="mb-8">
          <h2 id="approval" className="text-lg text-white mb-2">6. Document Approval</h2>
          <p>
            Administrator approval means a resource has been reviewed and cleared for
            publication on the platform. Approval does not necessarily mean XAS guarantees the
            academic accuracy, completeness, legality, or suitability of that resource.
          </p>
        </section>

        <section aria-labelledby="premium" className="mb-8">
          <h2 id="premium" className="text-lg text-white mb-2">7. Premium Documents</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium content may require an XAS access code to unlock.</li>
            <li>Access codes are intended for use by one XAS account only.</li>
            <li>You must not share, resell, duplicate, or attempt to bypass premium access.</li>
            <li>XAS may revoke access codes or accounts involved in abuse of the premium system.</li>
            <li>Premium access may expire or be revoked according to the applicable access period.</li>
          </ul>
        </section>

        <section aria-labelledby="ip" className="mb-8">
          <h2 id="ip" className="text-lg text-white mb-2">8. Intellectual Property</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The XAS branding, logo, interface, and original platform materials belong to XAS
              or their respective owners.
            </li>
            <li>Uploaded third-party material remains subject to its own copyright or license.</li>
            <li>
              You must not reproduce, sell, redistribute, or commercially exploit XAS materials
              without permission.
            </li>
          </ul>
        </section>

        <section aria-labelledby="comments" className="mb-8">
          <h2 id="comments" className="text-lg text-white mb-2">9. Comments, Ratings and Reports</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Comments must stay relevant to the document and respectful toward others.</li>
            <li>XAS may remove comments that violate these Terms.</li>
            <li>You may report documents or comments for moderation review.</li>
          </ul>
        </section>

        <section aria-labelledby="suspension" className="mb-8">
          <h2 id="suspension" className="text-lg text-white mb-2">10. Account Suspension or Termination</h2>
          <p>
            XAS may suspend or terminate accounts for serious or repeated violations of these
            Terms, security abuse, copyright violations, fraud, premium-code abuse, or other
            prohibited activity.
          </p>
        </section>

        <section aria-labelledby="availability" className="mb-8">
          <h2 id="availability" className="text-lg text-white mb-2">11. Platform Availability</h2>
          <p>
            XAS may modify, suspend, or discontinue features at any time. Reasonable efforts may
            be made to maintain availability, but uninterrupted service is not guaranteed.
          </p>
        </section>

        <section aria-labelledby="security" className="mb-8">
          <h2 id="security" className="text-lg text-white mb-2">12. Security</h2>
          <p>
            You must not attempt to compromise XAS security or access another user&apos;s
            account. Security incidents may be investigated and logged.
          </p>
        </section>

        <section aria-labelledby="privacy" className="mb-8">
          <h2 id="privacy" className="text-lg text-white mb-2">13. Privacy</h2>
          <p>
            Your personal information is handled according to the{" "}
            <Link href="/privacy" className="text-xas-gold underline">
              XAS Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="changes" className="mb-8">
          <h2 id="changes" className="text-lg text-white mb-2">14. Changes to These Terms</h2>
          <p>
            XAS may update these Terms from time to time. Continued use of the platform after an
            update means you accept the updated Terms, where legally applicable.
          </p>
        </section>

        <section aria-labelledby="contact" className="mb-8">
          <h2 id="contact" className="text-lg text-white mb-2">15. Contact</h2>
          <p>
            For questions about these Terms, use the XAS contact method published on the
            platform&apos;s support/settings page, which administrators keep up to date.
          </p>
        </section>
      </article>
    </main>
  );
}
