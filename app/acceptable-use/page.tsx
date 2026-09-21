import Link from "next/link";

export default function AcceptableUsePage() {
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
          Acceptable Use Policy
        </h1>
        <p className="mt-4 text-sm text-black/45">
          Effective date: September 8, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-7 text-black/70">
          <section>
            <h2>1. Purpose</h2>
            <p>
              This policy establishes standards for responsible use of Rivo
              Surveys and protects the integrity of accounts, surveys,
              rewards, infrastructure, users, and partners.
            </p>
          </section>

          <section>
            <h2>2. Fraud and Misrepresentation</h2>
            <p>
              You must not provide false identity information, impersonate
              another person, manipulate account information, or engage in
              fraudulent activity intended to obtain rewards or access.
            </p>
          </section>

          <section>
            <h2>3. Survey Manipulation</h2>
            <p>
              You must not intentionally provide random, contradictory,
              automated, fabricated, duplicated, or misleading responses for
              the purpose of qualifying for or completing surveys.
            </p>
          </section>

          <section>
            <h2>4. Automation and Bots</h2>
            <p>
              You must not use bots, scripts, crawlers, automated browsers, or
              other automated systems to create accounts, complete surveys,
              generate rewards, bypass eligibility requirements, or interfere
              with platform operation unless expressly authorized.
            </p>
          </section>

          <section>
            <h2>5. Security</h2>
            <p>
              You must not attempt to bypass authentication, access another
              user's account, probe restricted systems, exploit
              vulnerabilities, introduce malicious code, or interfere with
              platform security.
            </p>
          </section>

          <section>
            <h2>6. Multiple Accounts</h2>
            <p>
              Creating or controlling multiple accounts to bypass limits,
              restrictions, eligibility requirements, or reward controls is
              prohibited.
            </p>
          </section>

          <section>
            <h2>7. Abuse of Rewards</h2>
            <p>
              You must not manipulate balances, exploit technical errors,
              submit fabricated evidence, or otherwise attempt to obtain
              rewards to which you are not entitled.
            </p>
          </section>

          <section>
            <h2>8. Interference</h2>
            <p>
              You must not overload, disrupt, reverse engineer, damage, or
              interfere with the availability or normal operation of the
              platform.
            </p>
          </section>

          <section>
            <h2>9. Enforcement</h2>
            <p>
              Violations may result in survey rejection, reward adjustment,
              account restrictions, suspension, termination, or other
              measures reasonably necessary to protect the platform and its
              users.
            </p>
          </section>

          <section>
            <h2>10. Reporting Abuse</h2>
            <p>
              If you discover suspicious activity or a security issue,
              report it through the support or contact channel provided by
              Rivo Surveys rather than attempting to exploit the issue.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
