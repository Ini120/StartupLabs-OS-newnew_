

# Clerk Auth + Role Selection Page

## Overview
Install Clerk, add login/signup pages using Clerk's embedded components, and create a role selection page that saves the chosen role to the Supabase `user_roles` table. After role selection, users are redirected to their role-specific dashboard.

## Setup
- Install `@clerk/clerk-react`
- You'll provide your **Clerk Publishable Key** — we'll store it as `VITE_CLERK_PUBLISHABLE_KEY` in the `.env` file (publishable keys are safe in client code)

## Database Migration

Create `user_roles` table to map Clerk user IDs to roles:

```sql
CREATE TYPE public.app_role AS ENUM ('student', 'mentor', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,  -- Clerk user ID (text, not uuid)
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Public read/insert since auth is managed by Clerk externally
CREATE POLICY "Allow all access" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
```

## New Files

| File | Purpose |
|------|---------|
| `src/pages/auth/SignIn.tsx` | Clerk `<SignIn />` component in a centered layout |
| `src/pages/auth/SignUp.tsx` | Clerk `<SignUp />` component in a centered layout |
| `src/pages/auth/SelectRole.tsx` | Three cards (Student, Mentor, Admin) — saves selection to `user_roles`, redirects to `/dashboard` |
| `src/components/layout/AuthLayout.tsx` | Centered card with Startup OS branding, no sidebar |
| `src/components/auth/ProtectedRoute.tsx` | Checks Clerk auth + role in DB. Redirects to sign-in or role selection as needed |

## Changes to Existing Files

- **`src/main.tsx`** — Wrap `<App />` in `<ClerkProvider publishableKey={...}>`
- **`src/contexts/AuthContext.tsx`** — Replace mock auth with Clerk's `useUser()` + fetch role from Supabase `user_roles` table. Remove `switchRole` and mock imports.
- **`src/App.tsx`** — Add `/sign-in`, `/sign-up`, `/select-role` as public routes. Wrap dashboard routes with `<ProtectedRoute>`.
- **`src/components/layout/AppSidebar.tsx`** — Remove demo role switcher. Show real user name from Clerk. Logout via Clerk's `signOut()`.

## User Flow
1. Visit any page → `ProtectedRoute` checks Clerk session
2. Not signed in → redirect to `/sign-in`
3. Signed in, no role in `user_roles` → redirect to `/select-role`
4. Pick a role → saved to Supabase → redirect to `/dashboard`
5. Returning users go straight to dashboard

## Role Selection Page Design
- "Welcome to Startup OS" heading
- Three cards: Student (graduation cap), Mentor (message icon), Admin (settings icon)
- Each card has title + short description
- Click saves role and redirects

## What I Need From You
Your **Clerk Publishable Key** (starts with `pk_test_` or `pk_live_`). I'll add it to the `.env` file.

