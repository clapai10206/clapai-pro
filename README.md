This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local admin dashboard

Open `/admin` to manage enabled payment methods and the About, Privacy, Terms, and Contact pages. Configure these server-only variables in the project-root `.env.local` file before starting the site:

```env
ADMIN_PASSWORD=use_a_unique_password_at_least_16_characters_long
ADMIN_SESSION_SECRET=use_at_least_32_random_characters
```

The dashboard stores settings in `.data/site-settings.json` and encrypts saved payment API keys with `ADMIN_SESSION_SECRET`. `.env.local` and `.data/` are ignored by Git. This file-based storage is intended for local experimentation only: deployments with ephemeral filesystems can lose settings after redeploying, and multiple server instances will not share changes.

Payment display options and instructions are managed from `/admin/payments` and stored in `src/data/payments.json`; the editor is protected by the admin session. The optional WhatsApp number is blank by default. The JSON file is written at runtime, so this file-based editor is intended for local experimentation and requires a writable project directory. YouCan Pay uses its hosted checkout: save the private API key on the YouCan Pay method in `/admin`, then set `YOUCAN_PAY_SANDBOX=true` for testing or `false` for live payments. The Pro and Business checkout amounts use the prices shown on the site (99 MAD and 199 MAD). YouCan Pay API keys are encrypted in local settings and never sent to the browser.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
