# PuzzleQuest — Interactive Mystery Puzzle Adventure

A full-stack university Computer Science & Engineering project built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase (PostgreSQL + Auth + RLS)**.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Supabase Database**
   - Create a free project at [supabase.com](https://supabase.com).
   - Open the **SQL Editor** and execute `supabase/migrations/001_initial_schema.sql`.
   - Execute `supabase/seed.sql` to populate 4 Chapters, 12 Levels, 12 Interactive Puzzles, Answers, Progressive Hints, and 6 Achievements.

3. **Configure Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase keys:
   ```bash
   cp .env.example .env.local
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Promote an Admin User**
   Register an account in the app, then run in Supabase SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
