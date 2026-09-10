import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-black/45">
          Effective date: September 8, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-7 text-black/70">
          <section>
            <h2>1. Overview</h2>
            <p>
              This Privacy Policy explains how Rivo Surveys may collect, use,
              store, protect, and disclose information in connection with its
              website and services.
            </p>
          </section>

          <section>
            <h2>2. Information You Provide</h2>
            <p>
              When you create or use an account, we may collect information
              such as your email address, name, password-related authentication
              information, account identifiers, and information you voluntarily
              provide through the platform.
            </p>
          </section>

          <section>
            <h2>3. Authentication Information</h2>
            <p>
              If you authenticate through a supported third-party provider,
              such as Google, we may receive account information made available
              to us through that authentication flow, subject to the provider's
              permissions and policies.
            </p>
          </section>

          <section>
            <h2>4. Survey Information</h2>
            <p>
              Survey responses may be collected and processed according to the
              requirements of the relevant survey or research partner. The
              information requested by a survey may differ from one survey to
              another.
            </p>
          </section>

          <section>
            <h2>5. Technical Information</h2>
            <p>
              We may process technical information needed to operate and
              secure the service, such as authentication session information,
              security-related records, device or browser information where
              technically available, and information concerning requests made
              to the platform.
            </p>
          </section>

          <section>
            <h2>6. How We Use Information</h2>
            <p>
              Information may be used to create and manage accounts, provide
              surveys, calculate or maintain rewards, authenticate users,
              prevent abuse and fraud, maintain platform security, troubleshoot
              problems, improve the service, communicate important service
              information, and comply with applicable legal obligations.
            </p>
          </section>

          <section>
            <h2>7. Security</h2>
            <p>
              We use reasonable technical and organizational measures intended
              to protect information against unauthorized access, alteration,
              disclosure, or destruction. No internet-based service can
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>8. Passwords and Sessions</h2>
            <p>
              Passwords should not be stored or transmitted by users in plain
              text outside the intended authentication process. Authentication
              sessions may be represented by secure session credentials and
              protected server-side records.
            </p>
          </section>

          <section>
            <h2>9. Service Providers and Partners</h2>
            <p>
              Information may be processed by infrastructure providers,
              authentication providers, security services, survey partners, or
              other service providers where necessary to provide and protect
              the platform.
            </p>
          </section>

          <section>
            <h2>10. Legal and Safety Disclosures</h2>
            <p>
              Information may be disclosed where reasonably necessary to
              comply with law, respond to valid legal requests, investigate
              security incidents, enforce platform policies, or protect the
              rights, safety, and property of users or others.
            </p>
          </section>

          <section>
            <h2>11. Data Retention</h2>
            <p>
              We retain information for as long as reasonably necessary for the
              purposes described in this Policy, including account operation,
              security, fraud prevention, dispute handling, legal obligations,
              and legitimate operational requirements.
            </p>
          </section>

          <section>
            <h2>12. Cookies and Similar Technologies</h2>
            <p>
              Rivo Surveys may use cookies or similar technologies required for
              authentication, security, session management, and core platform
              functionality.
            </p>
          </section>

          <section>
            <h2>13. Your Choices and Rights</h2>
            <p>
              Depending on where you live and the laws that apply to you, you
              may have rights concerning access, correction, deletion,
              restriction, objection, or portability of certain personal
              information. Requests may be subject to identity verification
              and applicable legal limitations.
            </p>
          </section>

          <section>
            <h2>14. Children's Privacy</h2>
            <p>
              Rivo Surveys is not intended for individuals who are not legally
              permitted to use the service. We do not knowingly seek to collect
              personal information from children in violation of applicable
              law.
            </p>
          </section>

          <section>
            <h2>15. International Processing</h2>
            <p>
              Depending on infrastructure and service providers, information
              may be processed in countries other than the country where you
              live. Where required, appropriate safeguards will be considered
              for applicable transfers.
            </p>
          </section>

          <section>
            <h2>16. Policy Updates</h2>
            <p>
              We may update this Privacy Policy as the service, technology,
              legal requirements, or data practices change. The updated
              effective date will be displayed on the current version.
            </p>
          </section>

          <section>
            <h2>17. Contact</h2>
            <p>
              Privacy-related questions or requests can be sent to{" "}
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
