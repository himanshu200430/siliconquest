# SiliconQuest ⚡

> **Animeverse AR Scavenger Hunt**  
> Presented by **ACM**, in partnership with **Guru Gobind Singh Indraprastha University (GGSIPU EDC Student Chapter)** and **Elysian**.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![MindAR](https://img.shields.io/badge/MindAR-1.2.5-brightgreen)](https://hiukim.github.io/mind-ar-js-doc/)
[![A-Frame](https://img.shields.io/badge/A--Frame-1.5.0-ef2d5e?logo=a-frame)](https://aframe.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2d3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)

SiliconQuest is a mobile-first Augmented Reality (AR) scavenger hunt web application. Players explore the event grounds, discover 99 collectible anime character cards across 3 rarity tiers, scan them with their smartphone camera, and solve trivia challenges to capture characters and climb the tournament leaderboard.

---

## 🌟 Key Features

- 📱 **Zero-Install Web AR:** Powered by **A-Frame 1.5.0** and **MindAR 1.2.5**, running client-side computer vision directly in the mobile browser via WebGL and WebAssembly.
- 🎴 **99-Card Single-Scene Recognition:** All 99 physical cards are compiled into a unified target database (`cards.mind`), allowing instant scanning of any card without tearing down or switching scenes.
- ⏱️ **10-Second Target Persistence:** Once a card is detected, the character modal popup stays visible on screen for 10 seconds even if the camera moves away or tilts, giving participants plenty of time to collect the character.
- 🔄 **Interactive Team Switching:** Seamlessly change active teams at any time from the main dashboard, by clicking any team on the live leaderboard, or directly inside the AR camera HUD.
- 🧠 **Anti-Cheat Trivia Engine:** Server-authoritative answer verification with progressive cooldown timeouts for incorrect guesses. Correct answers are never sent to the client.
- 🛡️ **Hardware-Safe Camera Normalizer:** Intelligent device-type detection that prefers mobile rear cameras (`facingMode: environment`), prevents Windows Media Foundation / Dell IR sensor timeouts on laptops, releases hardware locks on tab unload, and avoids driver mutex collisions.
- 🏆 **Live Telemetry & Leaderboard:** Dynamic leaderboard with jittered background polling, active team auto-scroll, top-3 podium badges, and remaining card counters.
- 🛠️ **Game Master Admin Portal:** Built-in hidden administrative console (`Ctrl+Alt+A` / custom event) for team roster editing, card inspect/update, and one-click tournament database resets.

---

## 🏗️ Architecture & Tech Stack

```
siliconquest/
├── client/                     # Next.js 15.5 App Router web application
│   ├── src/
│   │   ├── app/                # App Router pages and REST API routes
│   │   │   ├── page.tsx        # Main game dashboard & team selection
│   │   │   └── api/            # Server-side API routes (/api/cards, /api/catch, /api/leaderboard)
│   │   ├── components/         # React UI and AR components
│   │   │   ├── ARCamera.tsx    # Full-screen AR camera orchestration & HUD
│   │   │   ├── ar-camera/      # MindAR scene, lifecycle hooks, UI overlays, cameraStreamHelper
│   │   │   ├── Pokeball.tsx    # 3D interactive launch button with energy animations
│   │   │   ├── Leaderboard.tsx # Interactive team standings with team-switching support
│   │   │   └── AdminPortal.tsx # Game master operations console
│   │   ├── data/
│   │   │   └── targetMap.json  # 0-based targetIndex to Card metadata mapping (99 targets)
│   │   └── services/           # Frontend API client methods
│   ├── public/
│   │   ├── ar-targets/         # Compiled MindAR target binary files (cards.mind)
│   │   └── cards-compile/      # Tightly cropped, preprocessed high-res target artwork
│   └── prisma/
│       └── schema.prisma       # PostgreSQL / Supabase schema (Card, Team, Catch, Cooldown)
├── scripts/
│   └── detection/              # Automated card extraction, feature audit & MindAR compilation pipeline
│       ├── build_targets.py    # Master end-to-end target compilation script
│       ├── step1_inspect.py    # Target metadata and aspect ratio inspection
│       ├── step2_extract.py    # 300 DPI PDF grid extraction & OCR name matching
│       ├── step3_build_compile_images.py # Artwork cropping & logo inpainting
│       ├── step4_compile.py    # MindAR compiler driver producing cards.mind
│       ├── step5_audit.py      # Spatial feature point density audit
│       └── step6_simulation.py # Simulated multi-variant detection test harness
├── README.md                   # Project documentation
└── PRD.md                      # Complete Product Requirements Document
```

### Technology Matrix

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15.5.4 (App Router, Turbopack, Standalone output) |
| **UI & Styling** | React 19.1.0, Tailwind CSS v4, PostCSS |
| **Computer Vision / AR** | MindAR 1.2.5, A-Frame 1.5.0, Three.js |
| **Database & ORM** | Supabase (PostgreSQL), Prisma ORM 6.19.3 |
| **Language & Tooling** | TypeScript 5, Python 3.10+ (PyMuPDF, OpenCV, Pillow for CV scripts) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `v20.x` or `v22.x`
- **npm:** `v10.x` or higher
- **PostgreSQL Database:** (e.g. Supabase instance) with direct and pooled connection strings.
- **Python:** `3.10+` (optional, only required if rebuilding the `.mind` target files from scratch).

### 1. Installation

Clone the repository and install dependencies in the `client` directory:

```bash
git clone https://github.com/himanshu200430/siliconquest.git
cd siliconquest/client
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `client/` directory with your PostgreSQL connection strings:

```env
# Pooler connection (e.g., Supabase transaction mode on port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (used by Prisma migrate on port 5432)
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Optional: Next.js public base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Initialize the Database

Push the Prisma schema to your PostgreSQL database and generate the Prisma Client:

```bash
cd client
npx prisma db push
npx prisma generate
```

*(Optional) Seed the 99 cards and default tournament teams:*
```bash
npx tsx scripts/seed_cards.ts
```

### 4. Run the Development Server

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note on Mobile Testing:**  
> Modern browsers restrict camera access to **secure contexts** (`https://` or `localhost`). When testing from a physical mobile device on the same local network, use an HTTPS tunnel such as [ngrok](https://ngrok.com/) or Cloudflare Tunnel:
> ```bash
> npx ngrok http 3000
> ```

---

## 🎴 Card Rarity Tiers & Scoring

The game features 99 physical cards split across three tiers:

| Tier | Card Count | Points Value | Accent Color | Visual Theme |
|---|:---:|:---:|:---:|---|
| **Common** | 64 | **8 pts** | Cyan / Slate (`#94a3b8`) | Sleek metallic border, high availability |
| **Rare** | 25 | **20 pts** | Purple / Violet (`#a855f7`) | Vibrant neon aura, moderate difficulty |
| **Legendary** | 10 | **50 pts** | Amber / Gold (`#f59e0b`) | Glowing animated core, prized targets |

---

## 🛠️ MindAR Target Compilation Pipeline

The target database `cards.mind` is built using reproducible Python scripts in `scripts/detection/`:

```bash
cd client
npm run build:targets
```

### Pipeline Steps:
1. **`step1_inspect.py`**: Validates target metadata, image dimensions, and aspect ratios.
2. **`step2_extract.py`**: Rasterizes the 11-page card deck PDF (`ALL_CARDS_FINAL.pdf`) at 300 DPI, crops 9 cards per page, and verifies 99 unique cards against `cards.json` using vision text matching.
3. **`step3_build_compile_images.py`**: Crops tightly to the artwork rectangle (stripping borders and labels) and inpaints the identical top-left diamond logo that causes false cross-matches.
4. **`step4_compile.py`**: Invokes the MindAR compiler to produce the unified `cards.mind` target file and synchronizes `client/src/data/targetMap.json`.
5. **`step5_audit.py`**: Measures spatial feature point density across a 4×4 grid on every card to ensure zero blind spots.
6. **`step6_simulation.py`**: Runs a 20-variant distortion test per card (perspective tilt up to 25°, blur, lighting variations, downscaling) to benchmark detection hit rates.

---

## 🔌 API Endpoints

All API endpoints are implemented as Next.js 15 App Router route handlers:

- **`GET /api/cards`** — Returns list of all cards (ID, name, series, value, tier, image). Correct answers are omitted.
- **`GET /api/cards/[id]/quiz`** — Returns trivia question and options for a specific card.
- **`POST /api/catch`** — Submits a team's answer for validation.
  - *Payload:* `{ teamId: string, cardId: string, selectedAnswer: number }`
  - *Success Response:* `{ success: true, correct: true, pointsAwarded: number }`
  - *Error Response:* `{ success: false, correct: false, cooldownSeconds: number }`
- **`GET /api/leaderboard`** — Returns active standings of all teams sorted by total score descending.
- **`GET /api/team/[id]`** — Returns a team's collected cards, score, and rank.
- **`POST /api/admin/mutate`** — Admin endpoint for adding/editing teams, updating cards, or triggering a database reset.

---

## 🤝 Contributing & Community

SiliconQuest was built for the ACM Animeverse event at GGSIPU. Contributions, bug reports, and optimizations are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
