import Link from "next/link";

export default function RewardsPolicyPage() {
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
          Platform Policy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Survey & Rewards Policy
        </h1>
        <p className="mt-4 text-sm text-black/45">
          Effective date: September 8, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] leading-7 text-black/70">
          <section>
            <h2>1. Survey Availability</h2>
            <p>
              Survey opportunities are not guaranteed. Availability may vary
              based on eligibility, survey requirements, response quotas,
              partner requirements, geographic availability, and other
              factors.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              Each survey may have its own qualification criteria. Completing
              a qualification step does not guarantee acceptance into the full
              survey or payment.
            </p>
          </section>

          <section>
            <h2>3. Honest Participation</h2>
            <p>
              Participants must provide genuine and thoughtful responses.
              Attempts to intentionally manipulate survey results, repeatedly
              submit low-quality answers, or provide fabricated information
              may cause activity to be rejected.
            </p>
          </section>

          <section>
            <h2>4. Quality Controls</h2>
            <p>
              Surveys or partners may use quality-control mechanisms designed
              to identify inconsistent, duplicated, automated, excessively
              rapid, or otherwise invalid responses.
            </p>
          </section>

          <section>
            <h2>5. Reward Amounts</h2>
            <p>
              The reward associated with an activity may vary by survey and
              may be displayed before or during the applicable activity where
              supported. Displayed rewards are subject to the applicable
              qualification and completion requirements.
            </p>
          </section>

          <section>
            <h2>6. Reward Reversals</h2>
            <p>
              A reward may be reversed or adjusted if the underlying activity
              is later determined to be invalid, fraudulent, duplicated,
              technically incorrect, rejected by a survey partner, or
              otherwise outside the applicable requirements.
            </p>
          </section>

          <section>
            <h2>7. Wallet Balances</h2>
            <p>
              Your wallet records the balance associated with your account.
              The existence of a balance does not by itself guarantee immediate
              withdrawal eligibility where additional requirements or review
              procedures apply.
            </p>
          </section>

          <section>
            <h2>8. Technical Errors</h2>
            <p>
              If a technical error causes an incorrect reward or balance to be
              displayed, Rivo Surveys may correct the affected record.
            </p>
          </section>

          <section>
            <h2>9. Prohibited Reward Activity</h2>
            <p>
              Users may not generate rewards through bots, multiple accounts,
              fabricated identities, fraudulent responses, manipulation of
              platform systems, or any other prohibited activity.
            </p>
          </section>

          <section>
            <h2>10. Changes</h2>
            <p>
              Survey availability, reward amounts, qualification requirements,
              and reward procedures may change over time. The applicable rules
              for a particular activity are those presented or otherwise
              communicated for that activity.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
