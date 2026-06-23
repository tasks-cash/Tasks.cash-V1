# Tasks.cash

Premium gamified task platform — dark fantasy meets sci-fi. Complete missions, earn portal coins, level up, and dominate the leaderboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Node.js, Express, Mongoose |
| Data | MongoDB, Redis-ready cache layer |
| Auth | JWT (Bearer tokens) |
| Infra | Docker, Docker Compose, Nginx |
| Package Manager | pnpm (monorepo) |

## Project Structure

```
Tasks.cash/
├── apps/
│   ├── web/                    # User-facing Next.js app (port 3000)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (public)/   # Public marketing pages
│   │       │   ├── (auth)/     # Login, register, password flows
│   │       │   ├── dashboard/  # User dashboard
│   │       │   └── api/        # Next.js API proxies → Express
│   │       ├── components/     # layout, game UI
│   │       ├── hooks/
│   │       ├── lib/            # db, auth, validations, constants
│   │       ├── services/
│   │       └── types/
│   └── admin/                  # Admin panel Next.js app (port 3001)
├── services/
│   ├── api/                    # REST API (port 4000)
│   ├── worker/                 # Background job processor
│   └── game-engine/            # XP, rewards, streaks logic
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── ui/                     # Design system + shadcn/ui
├── infra/
│   ├── docker/                 # Service Dockerfiles
│   └── nginx/                  # Reverse proxy config
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (optional)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Start infrastructure

```bash
pnpm docker:up    # MongoDB + Redis
pnpm seed         # Seed missions, rewards, admin user
```

### 4. Run development servers

```bash
pnpm dev          # Web + Admin + API in parallel
```

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Admin Panel | http://localhost:3001 |
| API | http://localhost:4000 |
| Nginx (Docker) | http://localhost:80 |

### Default Admin Credentials

```
Email:    admin@tasks.cash
Password: admin123
```

## Pages

### Public (Web App)

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About |
| `/worlds` | Worlds |
| `/challenges` | Challenges |
| `/missions` | Missions preview |
| `/treasure` | Treasure vault |
| `/leaderboards` | Leaderboards |
| `/community` | Community |
| `/store` | Store |
| `/faq` | FAQ |
| `/contact` | Contact |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |

### Authentication

| Route | Page |
|-------|------|
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Forgot Password |
| `/reset-password` | Reset Password |
| `/verify-email` | Verify Email |

### User Dashboard

| Route | Page |
|-------|------|
| `/dashboard` | Overview |
| `/dashboard/missions` | My Missions |
| `/dashboard/missions/submit` | Submit Mission Proof |
| `/dashboard/rewards` | My Rewards |
| `/dashboard/wallet` | Wallet |
| `/dashboard/withdrawals` | Withdrawals |
| `/dashboard/referrals` | Referral System |
| `/dashboard/level` | My Level / XP |
| `/dashboard/leaderboard` | Leaderboard Rank |
| `/dashboard/notifications` | Notifications |
| `/dashboard/profile` | Profile Settings |
| `/dashboard/security` | Security Settings |
| `/dashboard/support` | Support Tickets |

### Admin Panel

Overview, Users, Employees, Missions, Levels, Rewards, Treasures, Withdrawals, Referrals, Leaderboards, Challenges, Content, Notifications, Support, Settings, Audit Logs, Roles & Permissions — with add/edit forms.

## Database Models

`User`, `Employee`, `Mission`, `MissionSubmission`, `Reward`, `Wallet`, `Transaction`, `Withdrawal`, `Referral`, `Level`, `Leaderboard`, `Challenge`, `Treasure`, `Notification`, `SupportTicket`, `AuditLog`, `Role`, `Permission`, `SystemSetting`

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, password flows |
| `/api/users` | User profile, dashboard stats |
| `/api/employees` | Employee management |
| `/api/missions` | Mission CRUD & completion |
| `/api/submissions` | Mission proof submissions |
| `/api/rewards` | Rewards vault |
| `/api/wallet` | Wallet balance & transactions |
| `/api/withdrawals` | Withdrawal requests |
| `/api/referrals` | Referral stats |
| `/api/levels` | Level definitions |
| `/api/leaderboard` | Global rankings |
| `/api/challenges` | Timed challenges |
| `/api/treasures` | Treasure artifacts |
| `/api/notifications` | User notifications |
| `/api/support` | Support tickets |
| `/api/admin` | Admin operations |
| `/api/settings` | System & user settings |

## Design System

- **Theme**: Dark fantasy + sci-fi portal aesthetic
- **Colors**: Purple (`#7c3aed`) + Gold (`#fbbf24`) on black (`#0a0118`)
- **UI**: Glassmorphism cards, glow effects, Framer Motion animations
- **Components**: `@tasks-cash/ui` — GlassCard, PortalButton, GlowText, LevelBar, MissionCard, etc.

## Docker (Full Stack)

```bash
docker compose up -d --build
```

Services: `web`, `admin`, `api`, `worker`, `mongodb`, `redis`, `nginx`

## License

Private — Tasks.cash © 2026
# Tasks.cash-V1
