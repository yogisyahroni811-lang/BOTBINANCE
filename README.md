# BOTBINANCE 🤖

> **Autonomous AI Crypto Futures Trading Bot** — Price Action (Supply & Demand + Elliott Wave) + Self-Learning via RAG

[![CI — Rust Core](https://github.com/yogisyahroni811-lang/BOTBINANCE/actions/workflows/ci-rust.yml/badge.svg)](https://github.com/yogisyahroni811-lang/BOTBINANCE/actions/workflows/ci-rust.yml)
[![CI — Python AI](https://github.com/yogisyahroni811-lang/BOTBINANCE/actions/workflows/ci-python.yml/badge.svg)](https://github.com/yogisyahroni811-lang/BOTBINANCE/actions/workflows/ci-python.yml)
[![CI — Web Dashboard](https://github.com/yogisyahroni811-lang/BOTBINANCE/actions/workflows/ci-web.yml/badge.svg)](https://github.com/yogisyahroni811-lang/BOTBINANCE/actions/workflows/ci-web.yml)

---

## 📐 Architecture

```
Binance WebSocket ──► Rust Core ──► Python AI (LLM + RAG) ──► Execute Trade
                          │                                          │
                          └──────────────────── Supabase ◄──────────┘
                                                    │
                                            Next.js Dashboard
```

| Layer       | Tech          | Host    |
|-------------|---------------|---------|
| Core Engine | Rust + Tokio  | Render  |
| AI Brain    | Python + FastAPI | Vercel |
| Dashboard   | Next.js 14    | Vercel  |
| Database    | PostgreSQL    | Supabase |
| Notify      | Telegram Bot  | —       |

---

## 🗂️ Project Structure

```
BOTBINANCE/
├── core/          # Rust — WebSocket, S&D detection, Elliott Wave, execution
├── ai/            # Python — FastAPI, LLM (OpenAI/Claude), RAG, Mistake Analyzer
├── web/           # Next.js — Real-time dashboard
├── supabase/      # SQL migrations
├── .github/
│   └── workflows/ # CI/CD pipelines
├── docker-compose.yml
├── PRD.MD
└── rules.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Rust `>= 1.78` (`rustup`)
- Python `>= 3.11` (`uv` recommended)
- Node.js `>= 20` + pnpm
- Docker + Docker Compose
- Supabase account + project

### 1. Clone & setup env

```bash
git clone https://github.com/yogisyahroni811-lang/BOTBINANCE.git
cd BOTBINANCE
cp .env.example .env.local
# Fill in your API keys in .env.local
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

### 3. Or run each service manually

```bash
# Rust core
cd core && cargo run

# Python AI
cd ai && uv sync && uv run uvicorn main:app --reload

# Next.js web
cd web && pnpm install && pnpm dev
```

---

## ⚙️ Environment Variables

| Variable                  | Description                       | Required |
|---------------------------|-----------------------------------|----------|
| `BINANCE_API_KEY`         | Binance Futures API key           | ✅        |
| `BINANCE_API_SECRET`      | Binance Futures API secret        | ✅        |
| `SUPABASE_URL`            | Supabase project URL              | ✅        |
| `SUPABASE_SERVICE_KEY`    | Supabase service role key         | ✅        |
| `OPENAI_API_KEY`          | OpenAI API key for LLM            | ✅        |
| `TELEGRAM_BOT_TOKEN`      | Telegram bot token                | ✅        |
| `TELEGRAM_CHAT_ID`        | Your Telegram chat ID             | ✅        |
| `PYTHON_AI_URL`           | URL of Python AI service          | ✅        |
| `RUST_CORE_URL`           | URL of Rust core (for web)        | ✅        |

Copy `.env.example` and fill in values. **Never commit real secrets.**

---

## 📊 CI/CD Pipelines

| Pipeline          | Trigger               | Steps                                    |
|-------------------|-----------------------|------------------------------------------|
| `ci-rust.yml`     | Push to `main`/PRs    | fmt, clippy, test, build                 |
| `ci-python.yml`   | Push to `main`/PRs    | ruff lint, mypy, pytest                  |
| `ci-web.yml`      | Push to `main`/PRs    | eslint, type-check, build                |
| `deploy-core.yml` | Push to `main`        | Build Docker → deploy Render             |
| `deploy-ai.yml`   | Push to `main`        | Deploy to Vercel (Python edge)           |
| `deploy-web.yml`  | Push to `main`        | Auto-deploy via Vercel Git integration   |

---

## 📖 Documentation

- [`PRD.MD`](./PRD.MD) — Full Product Requirements Document
- [`rules.md`](./rules.md) — Development rules & conventions

---

## ⚠️ Disclaimer

This bot trades real money in volatile markets. Use at your own risk. Always test with small capital first. The authors are not responsible for any financial losses.
