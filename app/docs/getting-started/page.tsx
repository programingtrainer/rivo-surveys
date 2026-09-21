import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
            Rivo Surveys
          </Link>

          <Link
            href="/docs"
            className="text-sm font-medium text-black/60 hover:text-black"
          >
            Documentation
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/40">
          Documentation
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Getting Started
        </h1>

        <p className="mt-5 text-base leading-7 text-black/55">
          A practical guide to using Rivo Surveys.
        </p>

        <div className="mt-12 space-y-10">
          <section>
            <h2 className="text-2xl font-semibold">1. Create your account</h2>
            <p className="mt-3 leading-7 text-black/65">
              Create an account using the registration form and provide
              accurate information. Your account credentials are used to
              authenticate you and maintain your account session.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Sign in securely</h2>
            <p className="mt-3 leading-7 text-black/65">
              Use the login page to access your account. Never share your
              password or authentication information with another person.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Find available surveys</h2>
            <p className="mt-3 leading-7 text-black/65">
              Available surveys may differ between users. Eligibility can
              depend on survey requirements, profile information, location,
              availability, and other criteria established for a particular
              survey.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Complete surveys honestly</h2>
            <p className="mt-3 leading-7 text-black/65">
              Read each survey carefully and provide truthful, thoughtful
              responses. Do not intentionally provide random, contradictory,
              duplicated, automated, or misleading responses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Rewards and wallet</h2>
            <p className="mt-3 leading-7 text-black/65">
              Eligible completed activity may result in rewards according to
              the applicable survey and reward rules. Your wallet represents
              the balance associated with your Rivo account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Keep your account secure</h2>
            <p className="mt-3 leading-7 text-black/65">
              Use a strong, unique password and keep your login credentials
              confidential. If you believe your account has been compromised,
              stop using the affected credentials and contact the platform
              operator through the available support channel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Read the policies</h2>
            <p className="mt-3 leading-7 text-black/65">
              Your use of Rivo Surveys is subject to the Terms of Service,
              Privacy Policy, Acceptable Use Policy, and Survey & Rewards
              Policy.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/terms" className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black hover:text-white">
                Terms
              </Link>
              <Link href="/privacy" className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black hover:text-white">
                Privacy
              </Link>
              <Link href="/acceptable-use" className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black hover:text-white">
                Acceptable Use
              </Link>
              <Link href="/rewards-policy" className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black hover:text-white">
                Rewards Policy
              </Link>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
