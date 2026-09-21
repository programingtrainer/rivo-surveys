import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
            Rivo Surveys
          </Link>
          <Link href="/settings" className="text-sm text-black/60 hover:text-black">
            Settings
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/40">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-black/45">
          Effective date: September 8, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-7 text-black/70">
          <section>
            <h2>1. Acceptance of these Terms</h2>
            <p>
              These Terms of Service govern your access to and use of Rivo
              Surveys, including the website, account features, survey
              opportunities, wallet functionality, and related services.
              By creating an account, accessing the platform, or using any
              Rivo Surveys service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              You may use Rivo Surveys only if you are legally permitted to
              enter into these Terms and satisfy any eligibility requirements
              applicable to the platform or a particular survey. Individual
              surveys may impose additional eligibility requirements.
            </p>
          </section>

          <section>
            <h2>3. Your Account</h2>
            <p>
              You are responsible for providing accurate information when
              creating and maintaining your account. You are responsible for
              keeping your credentials confidential and for activities
              performed through your account.
            </p>
            <p>
              You must not create an account using false information, create
              accounts for another person without authorization, or maintain
              multiple accounts for the purpose of obtaining rewards or
              circumventing platform restrictions.
            </p>
          </section>

          <section>
            <h2>4. Surveys</h2>
            <p>
              Rivo Surveys may present survey opportunities from third-party
              research, advertising, market research, or other partners.
              Availability is not guaranteed and may vary by user.
            </p>
            <p>
              A survey may close, become unavailable, reach its required
              number of responses, or determine that you are not eligible.
              Rivo Surveys does not guarantee that any particular number of
              surveys will be available to you.
            </p>
          </section>

          <section>
            <h2>5. Survey Responses</h2>
            <p>
              You agree to provide truthful, accurate, thoughtful, and
              consistent responses. You must not intentionally submit random,
              fraudulent, automated, duplicated, misleading, or otherwise
              invalid responses.
            </p>
            <p>
              Survey partners may apply their own validation procedures.
              Activity determined to be invalid may be rejected and may not
              qualify for a reward.
            </p>
          </section>

          <section>
            <h2>6. Rewards and Wallet</h2>
            <p>
              Rewards are provided only for qualifying activity under the
              applicable survey and reward rules. A displayed balance does not
              necessarily mean that every amount is immediately withdrawable.
            </p>
            <p>
              Rivo Surveys may reverse, correct, withhold, or adjust a reward
              where activity is determined to be invalid, fraudulent,
              duplicated, technically erroneous, or otherwise ineligible.
            </p>
          </section>

          <section>
            <h2>7. Prohibited Conduct</h2>
            <p>
              You must not interfere with the operation or security of the
              platform, attempt unauthorized access, manipulate survey
              systems, use bots or scripts to generate activity, exploit
              technical vulnerabilities, submit fraudulent information, or
              engage in conduct prohibited by the Acceptable Use Policy.
            </p>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <p>
              Rivo Surveys and its associated software, branding, interfaces,
              text, graphics, and other original materials are protected by
              applicable intellectual property laws. Except as expressly
              permitted, you may not copy, reproduce, distribute, modify, or
              commercially exploit platform materials.
            </p>
          </section>

          <section>
            <h2>9. Third-Party Services</h2>
            <p>
              The platform may interact with third-party services, survey
              providers, authentication providers, or other external systems.
              Those services may have separate terms and privacy policies.
              Rivo Surveys is not responsible for terms, content, availability,
              or practices controlled exclusively by third parties.
            </p>
          </section>

          <section>
            <h2>10. Availability and Changes</h2>
            <p>
              We may modify, suspend, restrict, or discontinue portions of the
              platform at any time. Features, surveys, rewards, requirements,
              and availability may change as the service develops.
            </p>
          </section>

          <section>
            <h2>11. Account Suspension or Termination</h2>
            <p>
              We may suspend or terminate access where reasonably necessary to
              protect the platform, users, partners, or the integrity of
              surveys, including where we believe an account has violated
              these Terms or applicable policies.
            </p>
          </section>

          <section>
            <h2>12. Disclaimer</h2>
            <p>
              Rivo Surveys is provided on an as-available basis. To the maximum
              extent permitted by applicable law, we do not guarantee that the
              service will always be uninterrupted, error-free, secure, or
              available for a particular purpose.
            </p>
          </section>

          <section>
            <h2>13. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Rivo Surveys
              and its operators will not be liable for indirect, incidental,
              consequential, special, or punitive damages arising from use of
              the service, subject to any rights that cannot legally be
              excluded or limited.
            </p>
          </section>

          <section>
            <h2>14. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of
              Rivo Surveys after an updated version becomes effective
              constitutes acceptance of the updated Terms to the extent
              permitted by law.
            </p>
          </section>

          <section>
            <h2>15. Governing Law</h2>
            <p>
              These Terms are intended to operate subject to the mandatory laws
              applicable to you and the platform operator. Nothing in these
              Terms is intended to remove rights that cannot legally be
              excluded.
            </p>
          </section>

          <section>
            <h2>16. Contact</h2>
            <p>
              Questions regarding these Terms can be sent to{" "}
              <a
                href="mailto:rivosurveys@gmail.com"
                className="underline hover:text-black"
              >
                rivosurveys@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
