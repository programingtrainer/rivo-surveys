import Link from "next/link";

const sections = [
  {
    title: "Getting Started",
    description:
      "Learn how to create an account, sign in, complete your profile, and begin using Rivo Surveys.",
    href: "/docs/getting-started",
  },
  {
    title: "Surveys",
    description:
      "Understand survey availability, eligibility, completion requirements, quality checks, and submissions.",
    href: "/surveys",
  },
  {
    title: "Rewards & Wallet",
    description:
      "Learn how rewards are reflected in your account and how your wallet works.",
    href: "/wallet",
  },
  {
    title: "Account & Security",
    description:
      "Information about authentication, sessions, passwords, and keeping your account secure.",
    href: "/settings",
  },
  {
    title: "Terms of Service",
    description:
      "The legal terms that govern access to and use of Rivo Surveys.",
    href: "/terms",
  },
  {
    title: "Privacy Policy",
    description:
      "How Rivo Surveys handles account information and other data.",
    href: "/privacy",
  },
  {
    title: "Acceptable Use",
    description:
      "Rules designed to protect users, survey partners, and the integrity of the platform.",
    href: "/acceptable-use",
  },
  {
    title: "Survey & Rewards Policy",
    description:
      "Rules covering survey quality, eligibility, invalid activity, and rewards.",
    href: "/rewards-policy",
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
            Rivo Surveys
          </Link>

          <Link
            href="/settings"
            className="text-sm font-medium text-black/60 hover:text-black"
          >
            Settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/40">
            Documentation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Rivo Surveys Documentation
          </h1>

          <p className="mt-5 text-base leading-7 text-black/55 sm:text-lg">
            Everything you need to understand the Rivo Surveys platform,
            accounts, surveys, rewards, security, and platform policies.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h2 className="text-lg font-semibold group-hover:underline">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-black/55">
                    {section.description}
                  </p>
                </div>

                <span className="text-lg text-black/30 transition group-hover:text-black">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-12 rounded-3xl bg-black p-7 text-white sm:p-9">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
            Important
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Keep your account information accurate
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            Survey eligibility and rewards may depend on information provided
            by you and on requirements established for individual surveys.
            Always answer surveys honestly and follow the applicable survey
            instructions.
          </p>
        </section>
      </div>
    </main>
  );
}
