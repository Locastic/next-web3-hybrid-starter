# Next.js Web3 Hybrid Starter

This is a starter for building a web3 app with hybrid authentication using RainbowKit, Supabase for off-chain storage, and the new Next.js 15 / React 19 for server actions.

**Demo**: https://next-web3-hybrid-starter.vercel.app/

## Features

- Web3 RainbowKit authentication with JWTs cookies
- Global middleware for protected routes
- Server actions API with the following features:
  - public/protected middlewares and Zod schema validation
  - Available Supabase anon & service role apis
  - RLS wrapped by default: every query to the database is an RLS query (needs specific configuration)
- Login/Register/Logout/Delete flows
- Both `auth.users` with `public.profiles` tables are coupled: new users are created using supabase, a postgres trigger will insert the respective row to `public.profiles`

## Teck Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: PostgreSQL ([Supabase](https://supabase.com/))
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

## RLS configuration

In order to be able to use the RLS wrapper, you need to first create a new `rls_client` postgres user and use that in your `DATABASE_URL` env variable instead of the default `postgres` which bypasses RLS:

```sql
CREATE USER rls_client
WITH
  LOGIN PASSWORD '[DB_PASSWORD]';

GRANT anon TO rls_client;

GRANT authenticated TO rls_client;
```
Now, you'll have 2 different connection strings:
```.env
...
ADMIN_DATABASE_URL=postgresql://postgres(.pooler_tenant_id):[DB_PASSWORD]@...
DATABASE_URL=postgresql://rls_client(.pooler_tenant_id):[DB_PASSWORD]@...
...
```

## TODO:

- [ ] Fix flow:
  - [ ] session cookie expiration, how can we automatically logout web3 session?
- [ ] Implement simple Web3 Info UI (Balance, NFT count, ..)
- [ ] Implement basic Mint/Burn NFT flow
- [ ] Activity log
- [x] Use Supabase auth api to manage users (`auth.users`) instead of using our own users (`public.users`) table
- [x] Implement custom RLS middleware for Supabase (if DrizzleORM RLS support is not dropped yet)
