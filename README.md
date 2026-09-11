# THE ASSET — Anonymous Student Feedback

*Engineered to Serve. United to Lead.*

A Twitter-style anonymous feedback wall for the ASSET student council. Anyone
can post a concern with a category icon, and others can "support" (like) it
so it surfaces to the council. No logins, no names stored.

Stack: **Next.js 14 (App Router) + Tailwind + Supabase (Postgres, free tier) + Vercel.**

---

## 1. Run it locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the two Supabase values (step 2)
npm run dev
```

Open http://localhost:3000

---

## 2. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick any name/region, save the DB password somewhere safe.
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql` from this repo, and click **Run**. This creates the
   `posts` and `likes` tables, auto-updates like counts, and sets up
   Row Level Security so anyone can read/post/like without an account.
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Paste both into `.env.local`.
5. Optional but recommended: **Project Settings → Database → Realtime** —
   confirm the `posts` table has realtime enabled (it's on by default), so
   new posts and like counts appear live for everyone without a refresh.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "THE ASSET — initial build"
gh repo create the-asset --private --source=. --push
# no GitHub CLI? create an empty repo on github.com instead, then:
# git remote add origin https://github.com/<you>/the-asset.git
# git branch -M main
# git push -u origin main
```

`.env.local` is already in `.gitignore` — your Supabase keys won't be committed.
(The anon key is safe to expose publicly anyway; it only has the access you granted via RLS.)

---

## 4. Deploy on Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Under **Environment Variables**, add the same two keys from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. Every push to `main` redeploys automatically.
5. Add your custom domain (or a subdomain like `feedback.yourcouncil.org`) under **Project → Settings → Domains**.

---

## How the anonymity works

- No accounts, no emails, no IP stored anywhere in the schema.
- Each browser gets a random ID saved in its own `localStorage`
  (see `lib/anonId.ts`) purely so it can't like the same post twice —
  it isn't linked to a name or session on the server.
- Posts are capped at 500 characters and tagged with a category
  (Academics / Facilities / Safety / Administration / Other) plus an
  optional **Urgent** flag that highlights the card in red.

## Things worth adding before a real launch

- **Moderation**: right now anyone can post anything. Consider a simple
  admin view (a protected `/admin` route using Supabase auth for council
  members only) to hide/delete posts, since RLS currently allows open
  insert/delete on `likes` and open insert on `posts`.
- **Rate limiting**: add a Vercel Edge Middleware or Supabase Edge Function
  to stop spam floods from one device.
- **Profanity/abuse filtering**: a lightweight word-filter or a moderation
  queue before a post goes public, since it's representing formal concerns.

## Project structure

```
app/            routes (page.tsx = the feed), layout, global styles
components/     Logo, Composer, CategoryFilter, PostCard
lib/            supabaseClient, categories, anonId helper
supabase/       schema.sql — run once in the Supabase SQL editor
```
