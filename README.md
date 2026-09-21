# Rivo Surveys

Rivo Surveys is a Next.js rewards platform with survey integration, user accounts, challenges, referrals, wallet balances, and FaucetPay withdrawals.

## Stack

- Next.js 16 + React 19
- TypeScript
- Drizzle ORM
- PostgreSQL / Neon
- CPX Research API + postback
- Cloudflare Turnstile
- Google OAuth
- FaucetPay USDT payouts
- OpenNext / Cloudflare deployment support

## Local setup

1. Install dependencies:

```bash
npm ci
```

2. Copy `.env.example` to `.env.local` and fill in the real values.

3. Apply the Drizzle migrations to the configured PostgreSQL database.

4. Start development:

```bash
npm run dev
```

5. Production checks:

```bash
npm run lint
npm run build
```

## Important environment variables

- `DATABASE_URL`
- `CPX_APP_ID`
- `CPX_SECURE_HASH`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FAUCETPAY_API_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

Never commit `.env.local` or other real environment files.

## Core flows

- Authentication: email/password + Google OAuth
- Anti-bot protection: Cloudflare Turnstile on registration/login
- Surveys: CPX Research API, tracked attempts, signed postbacks, duplicate protection, reversals
- Challenges: Telegram codes, daily tasks, referrals
- Wallet: USD-denominated Rivo balance
- Withdrawals: 25% Rivo fee, minimum $15, daily $30 gross limit, one active withdrawal at a time
- Payouts: FaucetPay USDT with idempotent withdrawal processing
- Admin: users, tasks, Telegram codes, and withdrawal operations

## Daily tasks

Normal external-action tasks are instant-claim rewards and do not require administrator approval. Survey-completion and referral-completion tasks are verified server-side before crediting the reward.

## Security notes

- Sessions are stored as SHA-256 token hashes in the database and use an HTTP-only cookie.
- CPX postbacks are verified with the configured secure hash and transaction IDs are unique.
- Financial/task reward mutations use database transactions where multiple writes must succeed together.
- Referral/debug diagnostic endpoints are not exposed in the production project.
