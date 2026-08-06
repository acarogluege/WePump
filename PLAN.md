# WePump — Development Plan

> "Duolingo for the gym" — a social fitness app where gymrats track workouts, earn XP, keep streaks, and compete on leaderboards.

## 1. Concept

Users log their workouts (sets / reps / weight), earn XP for consistency and effort, maintain daily/weekly streaks, unlock badges, level up, and compete with friends and the world on weekly XP leaderboards.

**Core loop:** Work out → Log it → Earn XP → Climb leaderboard → Keep streak → Come back tomorrow.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile app | React Native + Expo (TypeScript) | One codebase, fast iteration, OTA updates |
| Backend | Supabase | Free tier, Postgres (efficient leaderboard queries), built-in auth, realtime, no vendor lock-in |
| Auth | Supabase Auth (email + Apple/Google sign-in) | Built-in, secure |
| State | Zustand + React Query | Simple, cache-friendly |
| Navigation | Expo Router | File-based, standard |
| Push notifications | Expo Notifications | Streak reminders, challenge alerts |

## 3. MVP Features

### 3.1 Workout Logging (manual)
- Exercise library (seeded: ~100 common exercises, searchable, grouped by muscle)
- Log workout: pick exercises → enter sets × reps × weight
- Rest-day marking
- Workout history & personal records (PRs) per exercise

### 3.2 Gamification (full)
- **XP**
  - Base XP per completed workout (e.g., 50 XP)
  - Bonus XP per set logged (capped daily to prevent farming)
  - PR bonus (+25 XP when beating a personal record)
  - Streak multiplier (e.g., ×1.5 at 7-day streak)
- **Streaks** — daily streak (workout or logged rest day keeps it), streak freeze item (1 free/week)
- **Levels** — cumulative XP → level curve (e.g., level N requires N² × 100 XP)
- **Badges** — first workout, 7/30/100-day streaks, 10/50/100 workouts, first PR, top-10 weekly finish, etc.
- **Challenges** — weekly rotating challenges ("Log 4 workouts this week", "Hit 3 PRs") with bonus XP rewards

### 3.3 Competition
- **Weekly XP leaderboard** — resets every Monday 00:00 UTC
  - Global top 100
  - Friends leaderboard
- Friends system: search by username, send/accept friend requests
- Public profile: level, badges, streak, weekly XP

### 3.4 Notifications
- Streak-at-risk reminder (evening, if no workout logged)
- "You've been passed on the leaderboard" alert
- Weekly results summary

## 4. Data Model (Postgres / Supabase)

```
profiles       (id → auth.users, username, avatar_url, level, total_xp, current_streak, longest_streak, streak_freezes)
exercises      (id, name, muscle_group, equipment, is_custom, created_by)
workouts       (id, user_id, started_at, completed_at, notes, xp_earned)
workout_sets   (id, workout_id, exercise_id, set_number, reps, weight_kg)
personal_records (user_id, exercise_id, best_weight_kg, best_reps, achieved_at)
xp_events      (id, user_id, amount, reason, created_at)          -- audit trail, source of truth for XP
weekly_xp      (user_id, week_start, xp)                          -- materialized for fast leaderboards
friendships    (user_id, friend_id, status: pending/accepted)
clubs          (id, name, description, avatar_url, owner_id, is_private)
club_members   (club_id, user_id, role: owner/admin/member, joined_at)
badges         (id, code, name, description, icon)
user_badges    (user_id, badge_id, earned_at)
challenges     (id, week_start, code, title, target, xp_reward)
user_challenges (user_id, challenge_id, progress, completed_at)
```

- Row Level Security (RLS) on all tables
- XP granted via Postgres functions/triggers (server-side, anti-cheat) — never trusted from the client
- Leaderboard = indexed query on `weekly_xp` (rank via `ROW_NUMBER()`)

## 5. Screens

1. **Onboarding** — sign up, username, goal setup
2. **Home / Dashboard** — streak flame, weekly XP, active challenges, "Start Workout" CTA
3. **Workout Logger** — exercise picker, set entry, finish → XP summary animation
4. **Leaderboard** — tabs: Global | Friends, weekly countdown timer
5. **Profile** — level ring, badges grid, PR list, history calendar (Duolingo-style)
6. **Friends** — search, requests, friend list
7. **Clubs** — club page, member list, member activity feed (Strava-style)
8. **Challenges** — weekly challenge cards with progress bars

## 6. Development Phases

| Phase | Deliverable |
|---|---|
| **0. Setup** | Expo app scaffold, Supabase project, CI-ready repo |
| **1. Auth & Profiles** | Sign up/in, username, profile screen skeleton |
| **2. Workout Logging** | Exercise library, logger flow, history, PRs |
| **3. XP Engine** | Server-side XP rules, levels, streaks, XP summary UI |
| **4. Social & Communities** | Friend requests, public profiles, clubs/teams with member activity visibility (Strava-style) — to be designed in depth when started |
| **5. Leaderboards** | weekly_xp pipeline, global + friends + club boards |
| **6. Badges & Challenges** | Badge engine, weekly challenges |
| **7. Notifications & Polish** | Push reminders, animations, empty states |
| **8. Beta Release** | TestFlight / Play internal testing |

## 7. Anti-Cheat & Fairness (important for competition)

- All XP computed server-side (DB functions), daily XP caps
- Rate limits on workout submissions
- Plausibility checks (e.g., flag 1000kg bench)
- Report button on leaderboard profiles (post-MVP)

## 8. Business Model & Growth

### Monetization: Freemium + Subscription (recommended)

One-time purchase doesn't fit — servers, leaderboards, and notifications are recurring costs, so revenue must be recurring too.

| Tier | Contents | Price |
|---|---|---|
| **Free** | Full core loop: logging, XP, streaks, levels, leaderboards, friends, basic badges | $0 — the growth engine, never paywall competition |
| **WePump Pro** | Advanced analytics (volume/PR charts), workout programs & templates, unlimited streak freezes, custom private challenges, profile customization, ad-free (if ads added) | ~$4.99/mo or ~$29.99/yr |
| **Consumables** | Streak repair, XP boosts | $0.99–1.99 each |

- Stores take 15–30% commission (15% under $1M/yr via Small Business Program)
- Use RevenueCat for subscription management (free until ~$2.5k MRR)

### Growth loop
1. **Demo/beta with basics free** → gather first gym communities
2. Friends leaderboard = built-in **viral invite loop** ("join so I can beat you")
3. Referral rewards (bonus XP / streak freeze per invited friend)
4. Weekly leaderboard results shareable as social media cards
5. Convert to Pro once users are streak-invested (Duolingo playbook: monetize loss-aversion)

### Later revenue options
- Gym partnerships (branded challenges, gym-vs-gym leagues)
- Sponsored challenges (supplement/apparel brands)

## 9. Post-MVP Ideas (parking lot)

- Duolingo-style leagues (Bronze → Diamond) with promotion/relegation
- Apple Health / Google Fit sync
- Workout templates & programs
- Calorie/nutrition tracking (no medical certification needed — wellness category; requires health-data privacy policy, no ads from health data)
- Body measurements / progress photos
- Gym check-in via GPS
- Premium tier (streak repair, custom challenges, stats)
