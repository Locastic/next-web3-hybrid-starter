# Next.js Web3 Hybrid Starter (WIP)

This is a starter for building a web3 app with hybrid authentication using RainbowKit, Supabase for off-chain storage, and the new Next.js 15 / React 19 for server actions.

**Demo**: https://next-web3-hybrid-starter.vercel.app/

## Features

- Web3 RainbowKit authentication with JWTs stored to cookies
- Global middleware to protected protected routes
- Server actions API with public/protected middlewares and Zod schema validation
- Login/Register/Logout/Delete flows

## Teck Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: PostgreSQL ([Supabase](https://supabase.com/]))
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
pnpm dlx create-next-app@latest --example "https://github.com/Locastic/next-web3-hybrid-starter"
```

## Running Locally

copy `.env.example` to `.env` and fill the values.

Then run the database migrations:

```bash
pnpm db:migrate
```

Finally, run the app:

```bash
pnpm dev
```

## TODO:

- [ ] Implement simple Web3 Info UI (Balance, NFT count, ..)
- [ ] Implement basic Mint/Burn NFT flow
- [ ] Activity log
- [ ] Use Supabase auth api to manage users (`auth.users`) instead of using our own users (`public.users`) table
- [ ] Implement custom RLS middleware for Supabase (if DrizzleORM RLS support is not dropped yet)
