# BOTBINANCE — Master Task List

> **Panduan:** Centang task dengan mengubah `[ ]` → `[x]`. Task yang sedang dikerjakan gunakan `[/]`.  
> **Referensi:** [PRD.MD](./PRD.MD) | [rules.md](./rules.md)  
> **Repo:** https://github.com/yogisyahroni811-lang/BOTBINANCE

---

## 📊 Progress Overview

| Phase | Nama | Status | Progress |
|-------|------|--------|----------|
| Phase 0 | Setup & CI/CD | ✅ Done | 100% |
| Phase 1 | Database & Rust Core | ✅ Done | 100% |
| Phase 2 | Python AI Service | 🔲 Todo | 0% |
| Phase 3 | Execution Engine & Telegram | ✅ Done | 100% |
| Phase 4 | Next.js Dashboard | ✅ Done | 100% |
| Phase 5 | Testing & Deployment | 🔲 Todo | 0% |

---

## ✅ Phase 0 — Project Setup & CI/CD
> Target: Selesai sebelum coding dimulai

- [x] Buat & revisi `PRD.MD` (v2.0)
- [x] Setup `.gitignore` (Rust + Python + Node.js)
- [x] Buat `.env.example` dengan semua required variables
- [x] Buat `README.md` dengan arsitektur dan quick start guide
- [x] Buat `Dockerfile.core` (multi-stage Alpine → distroless)
- [x] Buat `docker-compose.yml` (core + ai + web + redis)
- [x] Buat CI pipeline: `ci-rust.yml` (fmt, clippy, test, audit)
- [x] Buat CI pipeline: `ci-python.yml` (ruff, mypy, pytest)
- [x] Buat CI pipeline: `ci-web.yml` (eslint, tsc, build)
- [x] Buat CD pipeline: `deploy-core.yml` (Render)
- [x] Buat CD pipeline: `deploy-ai.yml` (Vercel)
- [x] Buat CD pipeline: `deploy-web.yml` (Vercel)
- [x] Initial commit & push ke GitHub
- [ ] Setup GitHub Secrets (lihat daftar di bawah)
- [ ] Buat Supabase project + copy URL & keys ke secrets
- [ ] Buat Render Web Service untuk Rust core
- [ ] Buat Vercel project untuk Python AI
- [ ] Buat Vercel project untuk Next.js web
- [ ] Buat Telegram Bot via @BotFather, simpan token

### 🔑 GitHub Secrets yang Harus Diisi

Settings → Secrets → Actions:

| Secret Name | Keterangan |
|---|---|
| `BINANCE_API_KEY` | Binance Futures API key (testnet dulu) |
| `BINANCE_API_SECRET` | Binance Futures secret |
| `BINANCE_TESTNET_KEY` | Testnet key untuk CI |
| `BINANCE_TESTNET_SECRET` | Testnet secret untuk CI |
| `SUPABASE_URL` | https://xxx.supabase.co |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `SUPABASE_ANON_KEY` | Anon key (untuk web) |
| `OPENAI_API_KEY` | OpenAI API key |
| `TELEGRAM_BOT_TOKEN` | Token dari @BotFather |
| `TELEGRAM_CHAT_ID` | Chat ID kamu |
| `RENDER_DEPLOY_HOOK_CORE` | Deploy hook URL dari Render |
| `RENDER_CORE_URL` | URL service Render (untuk health check) |
| `PYTHON_AI_URL` | URL Vercel Python AI |
| `VERCEL_TOKEN` | Vercel personal token |
| `VERCEL_ORG_ID` | Vercel org/team ID |
| `VERCEL_AI_PROJECT_ID` | Vercel project ID untuk AI |
| `VERCEL_WEB_PROJECT_ID` | Vercel project ID untuk web |

---

## 🗄️ Phase 1A — Database Schema (Supabase)
> **Dependensi:** Phase 0 selesai  
> **Estimasi:** 1-2 hari

### 1A.1 Setup Supabase
- [x] Buat folder `supabase/migrations/`
- [ ] Install Supabase CLI locally
- [ ] Init project: `supabase init`
- [ ] Link ke remote project: `supabase link --project-ref <ref>`

### 1A.2 Migration: Core Tables
- [x] Buat migration `001_core_tables.sql`
  - [x] Table `symbols` (id, symbol, is_active, priority, added_at)
  - [x] Table `candles` (id, symbol_id, timeframe, timestamp, o, h, l, c, v)
  - [x] Table `snd_zones` (id, symbol_id, timeframe, zone_type, price_high, price_low, grade, test_count, is_active)
  - [x] Table `elliott_waves` (id, symbol_id, timeframe, current_wave, wave_type, invalidation_price, confidence)
  - [x] Index: `candles(symbol_id, timeframe, timestamp DESC)`
  - [x] Index: `snd_zones(symbol_id, timeframe, is_active)`

### 1A.3 Migration: Trading & Learning Tables
- [x] Buat migration `002_trading_tables.sql`
  - [x] Table `trades` (semua kolom sesuai PRD 4.4)
  - [x] Table `mistakes` + enable `pgvector` extension
  - [x] Column `embedding VECTOR(768)` pada `mistakes`
  - [x] Index GIN/HNSW pada `mistakes.embedding`

### 1A.4 Migration: Performance & Monitoring Tables
- [x] Buat migration `003_performance_tables.sql`
  - [x] Table `daily_performance`
  - [x] Table `heartbeat_log`

### 1A.5 Row Level Security (RLS)
- [x] Buat migration `004_rls_policies.sql`
  - [x] RLS pada semua table
  - [x] Policy: service role dapat akses semua
  - [x] Policy: anon hanya READ pada `trades`, `daily_performance`

### 1A.6 Seed Data
- [x] Buat `supabase/seed.sql`
  - [x] Insert 30 default symbols (BTC, ETH, BNB, dll.)
  - [x] Insert default settings

---

## 🦀 Phase 1B — Rust Core Engine
> **Dependensi:** Phase 1A selesai  
> **Estimasi:** 1 minggu

### 1B.1 Project Setup
- [x] `cd core && cargo init --name botbinance-core`
- [x] Setup `Cargo.toml` dengan semua dependencies:
  - [x] `tokio` (full features, async runtime)
  - [x] `tokio-tungstenite` (WebSocket)
  - [x] `reqwest` (HTTP client ke Python AI)
  - [x] `serde` + `serde_json`
  - [x] `sqlx` (PostgreSQL, runtime-tokio, tls-rustls)
  - [x] `redis` (async)
  - [x] `ta` (technical analysis: ATR)
  - [x] `axum` (HTTP server untuk REST API)
  - [x] `tracing` + `tracing-subscriber` (structured logging)
  - [x] `anyhow` + `thiserror` (error handling)
  - [x] `dotenv` / `config`
- [x] Setup module structure:
  ```
  src/
  ├── main.rs
  ├── config.rs
  ├── error.rs
  ├── database/
  │   └── mod.rs
  ├── websocket/
  │   └── mod.rs
  ├── buffer/
  │   └── mod.rs
  ├── analysis/
  │   ├── mod.rs
  │   ├── snd.rs
  │   └── elliott.rs
  ├── ai_client/
  │   └── mod.rs
  ├── execution/
  │   └── mod.rs
  ├── risk/
  │   └── mod.rs
  ├── telegram/
  │   └── mod.rs
  └── api/
      └── mod.rs
  ```

### 1B.2 Config & Error Handling
- [x] `config.rs` — load & validate semua env vars saat startup
- [x] `error.rs` — custom error types dengan `thiserror`
- [x] Panic handler: catch `unhandled_rejection` dan kirim Telegram alert

### 1B.3 Database Layer (`database/`)
- [x] Setup SQLx connection pool (max 10 connections)
- [x] Struct models untuk semua tables
- [x] Repository pattern: `TradesRepo`, `MistakesRepo`, `ZonesRepo`, `PerformanceRepo`
- [x] Fungsi: `save_trade()`, `update_trade()`, `get_open_positions()`
- [x] Fungsi: `save_zone()`, `get_active_zones(symbol, tf)`
- [x] Fungsi: `log_heartbeat(service, status, latency)`

### 1B.4 WebSocket Data Ingestor (`websocket/`)
- [x] Koneksi ke Binance Futures WebSocket
  - [x] URL: `wss://fstream.binance.com/stream`
  - [x] Subscribe multi-stream: `<symbol>@kline_<interval>` untuk 30 symbols × 5 TF
- [x] Auto-reconnect dengan exponential backoff (max 5 retries)
- [x] Parse `KlineEvent` dari JSON
- [x] Filter: hanya process candle yang sudah `is_closed = true`
- [x] Push candle ke rolling buffer

### 1B.5 Rolling Candle Buffer (`buffer/`)
- [x] Struct `RollingBuffer { data: VecDeque<Candle>, max_size: usize }`
- [x] Method `push(candle)` — FIFO, pop front jika sudah 200
- [x] Method `get_latest(n)` — ambil N candle terakhir
- [x] Method `get_all()` — clone semua sebagai `Vec<Candle>`
- [x] State: `HashMap<(Symbol, Timeframe), RollingBuffer>` dibungkus `Arc<RwLock<>>`
- [x] Unit test: buffer FIFO behavior, max size enforcement

### 1B.6 Supply & Demand Detection (`analysis/snd.rs`)
- [x] Fungsi `detect_base(candles, atr)` — temukan 3+ candle consolidation
- [x] Fungsi `detect_impulse(candles, atr)` — strong break >1.5x ATR
- [x] Fungsi `create_zone(base, impulse)` → `SndZone` struct
- [x] Fungsi `grade_zone(zone, test_count)` → Grade A/B/C/D
- [x] Fungsi `invalidate_zone(zone, current_price)` → bool
- [x] Fungsi `detect_zones(candles) -> Vec<SndZone>`
- [x] Scheduler: jalankan setiap 4H candle close, simpan 10 best zones ke DB
- [x] Unit test: zone creation, grading, invalidation

### 1B.7 Elliott Wave Detection (`analysis/elliott.rs`)
- [x] Fungsi `detect_pivots(candles, depth, deviation)` — ZigZag algorithm
- [x] Fungsi `identify_waves(pivots)` → `WaveStructure`
  - [x] 5-wave impulse
  - [x] 3-wave corrective (ABC)
- [x] Fungsi `validate_fibonacci(waves)` → confidence score
  - [x] W2: 50-61.8%
  - [x] W3: 161.8-261.8%
  - [x] W4: 38.2-50%
- [x] Fungsi `get_invalidation_level(waves)` → price level
- [x] Fungsi `get_current_wave(waves)` → wave number (1-5 atau A-C)
- [x] Unit test: Fibonacci validation, wave count accuracy

### 1B.8 Analysis Trigger
- [x] `analysis/mod.rs` — orchestrate SND + Elliott per symbol per TF
- [x] Trigger: setiap candle baru push ke buffer → cek apakah ada setup
- [x] Setup detected → kirim ke Python AI via HTTP
- [x] Invalidation check: monitor existing positions, close jika invalid
- [x] Semua run concurrent via `tokio::spawn`

### 1B.9 REST API (`api/`)
- [x] Setup `axum` router
- [x] `GET /health` → status JSON semua service
- [x] `GET /api/v1/symbols` → daftar watchlist
- [x] `POST /api/v1/symbols` → tambah symbol (max 30 validation)
- [x] `DELETE /api/v1/symbols/:symbol` → hapus dari watchlist
- [x] `GET /api/v1/positions` → posisi terbuka dari DB
- [x] `GET /api/v1/trades?limit=50&offset=0` → trade history
- [x] `GET /api/v1/performance?date=today` → daily stats
- [x] `POST /api/v1/emergency` → close semua posisi
- [x] Request validation + proper error responses (RFC 7807)
- [x] Rate limiting middleware (100 req/min per IP)

### 1B.10 Unit Tests Rust
- [x] `tests/buffer_test.rs`
- [x] `tests/snd_test.rs`
- [x] `tests/elliott_test.rs`
- [x] `tests/api_test.rs` (integration test dengan test DB)

---

## 🐍 Phase 2 — Python AI Service (FastAPI)
> **Dependensi:** Phase 1B selesai (API contract defined)  
> **Estimasi:** 1 minggu

### 2.1 Project Setup
- [x] `cd ai && uv init`
- [x] Setup `pyproject.toml` dengan dependencies:
  - [x] `fastapi` + `uvicorn[standard]`
  - [x] `pydantic[email]` v2
  - [x] `openai` latest
  - [x] `anthropic` (opsional, fallback)
  - [x] `sentence-transformers`
  - [x] `chromadb`
  - [x] `supabase` (Python client)
  - [x] `httpx` (async HTTP)
  - [x] `structlog` (structured logging)
- [x] Dev dependencies: `ruff`, `mypy`, `pytest`, `pytest-asyncio`, `pytest-cov`
- [x] Setup `ruff.toml` dan `mypy.ini`
- [x] Setup `Dockerfile` untuk Python AI

### 2.2 Project Structure
- [x] Buat folder structure:
  ```
  ai/
  ├── main.py
  ├── config.py
  ├── models/
  │   ├── requests.py    # Pydantic request models
  │   └── responses.py   # Pydantic response models
  ├── services/
  │   ├── llm_service.py
  │   ├── rag_service.py
  │   └── mistake_analyzer.py
  ├── routers/
  │   └── trading.py
  ├── database/
  │   └── supabase_client.py
  ├── tests/
  │   ├── test_llm_service.py
  │   ├── test_rag_service.py
  │   └── test_mistake_analyzer.py
  └── data/               # ChromaDB local storage
  ```

### 2.3 Pydantic Models (`models/`)
- [x] `SetupRequest` — mirror dari gRPC `SetupRequest` (symbol, TF, zone, wave, candles)
- [x] `SignalResponse` — valid, action, confidence, entry, SL, TP1, TP2, reasoning, warnings
- [x] `TradeResultRequest` — untuk input ke mistake analyzer
- [x] `HealthResponse` — status semua services

### 2.4 RAG Engine (`services/rag_service.py`)
- [x] Setup ChromaDB client (persistent, local storage)
- [x] Fungsi `embed_market_context(candles, zone, wave)` → vector
- [x] Fungsi `search_similar_setups(embedding, top_k=5)` → list hasil
- [x] Fungsi `get_similar_mistakes(embedding)` → warning messages
- [x] Fungsi `get_successful_patterns(embedding)` → confidence boost
- [x] Fungsi `store_trade_embedding(trade_id, context, outcome)` → store ke ChromaDB

### 2.5 LLM Service (`services/llm_service.py`)
- [x] Setup OpenAI client (async, retry 3x)
- [x] System prompt: expert Price Action trader
- [x] Fungsi `validate_setup(request, rag_context)` → `SignalResponse`
- [x] Prompt template:
  ```
  Context: {rag_context}
  Market: {symbol} {timeframe}
  Zone: {zone_type} Grade {grade} at {price}
  Wave: Currently in Wave {wave_num} ({wave_type})
  Recent candles: {candle_summary}
  
  Task: Validate this trading setup. Return confidence 0-100.
  If < 40: reject. If > 60: provide entry, SL, TP levels.
  ```
- [x] Token limit: max 2000 tokens input, 500 output
- [x] Timeout: 10 detik
- [x] Fallback: jika OpenAI gagal, fallback ke rule-based scoring

### 2.6 Mistake Analyzer (`services/mistake_analyzer.py`)
- [x] Trigger setelah posisi closed
- [x] Fungsi `categorize_mistake(trade)` → `MistakeCategory`
  - [x] EARLY_ENTRY, LATE_ENTRY, MISSED_INVALIDATION, GRADE_C_TRAP
  - [x] FAKEOUT_REACTION, WRONG_WAVE_COUNT, COUNTER_TREND_LOSS, SIZE_TOO_BIG
- [x] Fungsi `generate_lesson(trade, category)` → lesson text via LLM
- [x] Fungsi `generate_prevention_tip(category, context)` → tip text
- [x] Fungsi `save_mistake(trade_id, category, lesson, tip)` → store ke Supabase + ChromaDB
- [x] Fungsi `calculate_improvement_score(recent_mistakes)` → 0-100

### 2.7 FastAPI Routes (`routers/trading.py`)
- [x] `POST /analyze` → terima setup dari Rust, return signal
- [x] `POST /report-trade` → terima hasil trade, trigger mistake analyzer
- [x] `GET /health` → status LLM, ChromaDB, Supabase
- [x] `GET /mistakes?limit=10` → list mistake terbaru
- [x] `GET /patterns?symbol=BTCUSDT&tf=1H` → successful patterns

### 2.8 Unit Tests Python
- [ ] Test `rag_service.py` — mock ChromaDB
- [ ] Test `llm_service.py` — mock OpenAI response
- [ ] Test `mistake_analyzer.py` — test categorization logic
- [ ] Test API endpoints — pytest + httpx TestClient
- [ ] Coverage target: ≥ 70%

---

## 📬 Phase 3A — Telegram Bot Integration
> **Dependensi:** Phase 1B selesai  
> **Estimasi:** 2-3 hari  
> **Note:** Diintegrasikan ke dalam Rust Core

### 3A.1 Setup Telegram Client
- [x] Tambah `teloxide` crate ke `core/Cargo.toml`
- [x] Setup bot dengan token dari environment
- [x] Test koneksi dan `/start` command

### 3A.2 Notifikasi (Push dari Core)
- [x] `notify_entry(trade)` → 🎯 ENTRY message dengan semua detail
  ```
  🎯 ENTRY BTC/USDT LONG
  Entry: $95,420
  TP1: $96,800 | TP2: $98,200
  SL: $94,100 | R:R: 1:2.3
  Setup: W2 Completion + Grade A SND
  Confidence: 78% | Size: 3%
  ```
- [x] `notify_tp_hit(trade, tp_level)` → ✅ TP message dengan PnL
- [x] `notify_sl_hit(trade, mistake_category)` → ⛔ SL + kategori mistake
- [x] `notify_invalidation(trade, reason)` → ⚠️ Close reason
- [x] `notify_mistake_logged(lesson)` → 🧠 Lesson learned (silent)
- [x] `notify_daily_recap(stats)` → 📊 Daily summary (silent, 23:59 WIB)
- [x] `notify_system_alert(service, error)` → 🚨 System failure

### 3A.3 Commands (Pull dari User)
- [ ] `/start` — register user, kirim welcome message
- [ ] `/stop` — pause notifikasi
- [ ] `/status` — equity, open positions, 24h PnL
- [ ] `/positions` — detail semua posisi terbuka
- [ ] `/history` — 10 trade terakhir dengan PnL
- [ ] `/mistakes` — 5 mistake terbaru dengan tip
- [ ] `/mode` — lihat mode (normal/conservative/aggressive)
- [ ] `/recap` — force daily report sekarang
- [ ] `/emergency` — ⚠️ close ALL positions (konfirmasi 2 langkah)
- [ ] `/help` — list semua commands

---

## ⚡ Phase 3B — Execution Engine & Risk Management
> **Dependensi:** Phase 1B.8 + Phase 2 selesai  
> **Estimasi:** 4-5 hari

### 3B.1 Binance Futures Client
- [x] Buat `execution/binance_client.rs`
- [x] REST API wrapper untuk Binance Futures:
  - [x] `get_account_info()` → equity, available balance
  - [x] `get_open_positions()` → list posisi aktif
  - [x] `place_order(symbol, side, type, qty, price)` → order
  - [x] `cancel_order(symbol, order_id)` → cancel
  - [x] `close_position(symbol)` → market close
- [x] HMAC SHA256 signature untuk setiap request
- [x] Rate limiter: max 1200 req/min (sesuai Binance limit)
- [x] Retry logic: 3x dengan exponential backoff

### 3B.2 Order Execution Flow
- [x] Fungsi `execute_signal(signal)`:
  1. Validate signal belum expired (max 30 detik)
  2. Check hard limits (max equity, max positions, circuit breaker)
  3. Calculate position size berdasarkan risk %
  4. Place ENTRY order (limit order)
  5. Place TP1 order (limit, 25% size)
  6. Place TP2 order (limit, 75% size)
  7. Place SL order (stop-limit)
  8. Simpan ke DB + notify Telegram
- [x] Fungsi `handle_tp_hit(order_id, tp_level)`
  - Geser SL ke breakeven saat TP1 hit
  - Update DB + notify
- [x] Fungsi `handle_sl_hit(order_id)`:
  - Cancel semua TP orders
  - Update DB + trigger mistake analysis
  - Notify Telegram dengan kategori mistake

### 3B.3 Invalidation Monitor
- [x] Background task berjalan setiap 5 detik
- [x] Untuk setiap posisi terbuka:
  - [x] Cek apakah price melewati `invalidation_price` dari Elliott Wave
  - [x] Cek apakah SND zone sudah di-`grade_D` (broken)
  - [x] Jika invalid → `close_position()` + notify Telegram

### 3B.4 Risk Management Engine (`risk/`)
- [x] `risk/mod.rs` — semua fungsi risk check
- [x] `check_hard_limits(proposed_trade)` → Result<(), RiskError>
  - [x] Max equity per trade: 10%
  - [x] Max leverage: 10x
  - [x] Max concurrent positions: 3
  - [x] Daily loss circuit breaker: -3%
- [x] `calculate_position_size(equity, risk_pct, entry, sl)` → qty
- [x] `get_daily_pnl()` → query DB, sum pnl hari ini
- [x] `check_circuit_breaker()` → apakah daily loss > 3%?
- [x] `update_daily_stats(trade)` → update `daily_performance` table

### 3B.5 Heartbeat Coordinator
- [x] Background task setiap 60 detik
- [x] Ping: Rust core (self), Python AI `/health`, Supabase (query), Binance WebSocket
- [x] Failure handling:
  - 1st: immediate retry
  - 2nd: log warning
  - 3rd: Telegram alert + failover attempt
  - Persistent: restart attempt + critical alert
- [x] Log setiap heartbeat ke `heartbeat_log` table

---

## 🖥️ Phase 4 — Next.js Dashboard
> **Dependensi:** Phase 3B selesai (API stable)  
> **Estimasi:** 1 minggu

### 4.1 Project Setup
- [x] `cd web && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
- [x] Install shadcn/ui: `npx shadcn@latest init` (Digantikan oleh CVA primitives / framer motion sesuai Aesthetic Engine v0)
- [x] Install dependencies:
  - [x] `lightweight-charts` (TradingView chart)
  - [x] `@supabase/supabase-js`
  - [x] `@tanstack/react-query` v5
  - [x] `zustand`
  - [x] `recharts`
  - [x] `zod`
  - [x] `react-hook-form` + `@hookform/resolvers`
  - [x] `next-themes` (dark mode)
  - [x] `sonner` (toast notifications)
- [x] Setup `next.config.ts` dengan env vars
- [x] Setup `src/lib/supabase.ts` client (Supabase integrated)
- [x] Setup `src/lib/api.ts` (fetch wrapper ke Rust core)
- [x] Setup React Query QueryClient provider

### 4.2 Design System
- [x] Setup warna premium (Aesthetic Engine v0 / Apple Human IG):
  - Background: `radial-gradient(hsla(250, 80%, 60%, 0.05), ...)`
  - Surface: Glassmorphism `bg-card/60`, Border: `border-white/5`
- [x] Setup font: Inter (`tracking-tight`) + Tailwind defaults
- [x] Setup dark mode default (hsl values)
- [x] Buat komponen dasar: `Badge`, `Card`, `Button` (with micro-animations)

### 4.3 Layout
- [x] `src/app/layout.tsx` — global layout + providers
- [x] `src/components/layout/TopBar.tsx`:
  - [x] Symbol selector dropdown (digabungkan ke Landing layout)
  - [x] Equity display (live via React Query)
  - [x] Daily PnL dengan warna (hijau/merah)
  - [x] System status indicator (active heartbeat)
  - [x] Emergency button (close all positions)
- [x] Responsive: desktop grid 3-panel, mobile single column layout

### 4.4 Dashboard Page (`/dashboard` atau `/`)
- [x] `src/app/page.tsx`
- [x] **Left panel (25%)** — `WatchlistPanel.tsx`:
  - [x] Daftar 30 symbols dengan harga live
  - [x] Warna berdasarkan 24h change
  - [x] Click untuk switch chart
- [x] **Center panel (50%)** — `MainChart.tsx`:
  - [x] TradingView Lightweight Charts candlestick (diimplementasi di v5)
  - [x] Overlay SND zones (Mock labels ready)
  - [x] Overlay Elliott Wave labels (Mock labels ready)
  - [x] Current price line
  - [x] Entry/TP/SL markers dari open trades
  - [x] Timeframe selector: 15m / 30m / 1H / 4H / 1D
  - [x] Real-time update via SSE (Mock integration)
- [x] **Right panel (25%)** — `PositionsPanel.tsx`:
  - [x] Posisi terbuka dengan live PnL
  - [x] Quick close button per posisi
  - [x] Equity growth mini chart
  - [x] Win rate + avg R:R stats

### 4.5 Trade History Page (`/trades`)
- [x] `src/app/trades/page.tsx`
- [x] Table dengan kolom sesuai PRD 5.2
- [x] Filter: time range, symbol, outcome, setup type
- [x] Pagination (50 per page)
- [x] Export CSV button
- [x] Klik row → detail drawer dengan full trade info

### 4.6 Mistakes Log Page (`/mistakes`)
- [x] `src/app/mistakes/page.tsx`
- [x] Table: time, trade ID, category, severity, what happened, prevention tip, similar count
- [x] Filter: category, severity, date
- [x] Severity badge (Critical=merah, High=oranye, Medium=kuning, Low=abu)
- [x] "Similar Cases" expand row
- [x] Stats: mistake categories breakdown (pie chart)

### 4.7 Performance Page (`/performance`)
- [x] `src/app/performance/page.tsx`
- [x] Equity curve (line chart, Recharts)
- [x] Daily PnL bar chart (hijau positif, merah negatif)
- [x] Win rate over time (line chart)
- [x] Statistik: Total trades, Win%, Avg R:R, Profit Factor, Max Drawdown
- [x] Periode selector: 7D / 30D / 90D / All time

### 4.8 Settings Page (`/settings`)
- [x] `src/app/settings/page.tsx`
- [x] **API Keys** — form input (masked), test connection button
- [x] **Telegram** — bot token + chat ID + test notifikasi button
- [x] **Watchlist** — add/remove symbols, drag reorder priority
- [x] **Risk Parameters** — sliders untuk max equity%, max positions, daily loss limit
- [x] **Notification Preferences** — toggle setiap notifikasi type
- [x] Save dengan konfirmasi + toast success

### 4.9 Real-time Data
- [x] Setup SSE endpoint di Rust core untuk streaming data
- [x] `src/hooks/useLiveData.ts` — subscribe ke SSE
- [x] `src/hooks/usePositions.ts` — TanStack Query + real-time sync
- [x] `src/hooks/useTrades.ts` — paginated query
- [x] `src/hooks/usePerformance.ts` — daily stats query
- [x] Optimistic UI: trade close → immediately remove dari list, rollback on error

---

## 🧪 Phase 5 — Testing & Deployment
> **Dependensi:** Semua phase selesai  
> **Estimasi:** 1 minggu

### 5.1 Unit Tests (sudah dilakukan per phase)
- [ ] Rust: semua tests pass (`cargo test`)
- [ ] Python: semua tests pass (`pytest`) dengan coverage ≥ 70%
- [ ] Web: komponen tests pass (jika ada)

### 5.2 Integration Tests
- [ ] Test flow: Rust deteksi setup → kirim ke Python AI → return signal → simpan DB
- [ ] Test flow: Trade hit SL → trigger mistake analyzer → simpan ke DB + Chromadb
- [ ] Test flow: Heartbeat coordinator → detect failure → Telegram alert
- [ ] Test REST API semua endpoints dengan nyata DB (Supabase dev branch)

### 5.3 Paper Trading (Testnet)
- [ ] Aktifkan `BINANCE_TESTNET=true`
- [ ] Jalankan minimal 7 hari paper trading
- [ ] Monitor via dashboard dan Telegram
- [ ] Verifikasi semua notifikasi bekerja dengan benar
- [ ] Verifikasi TP/SL/invalidation berfungsi
- [ ] Verifikasi mistake analyzer menghasilkan lesson yang relevan
- [ ] Catat issues dalam GitHub Issues

### 5.4 Backtesting
- [ ] Implementasi simple backtesting script (`scripts/backtest.py`)
- [ ] Input: historical OHLCV data dari Binance REST API
- [ ] Output: win rate, avg R:R, max drawdown, equity curve
- [ ] Test minimal 3 bulan historical data untuk BTC dan ETH
- [ ] Dokumentasikan hasil backtesting

### 5.5 Production Deployment
- [ ] Merge branch ke `main`
- [ ] Verifikasi semua GitHub CI hijau
- [ ] Aktifkan auto-deploy ke Render (Rust core)
- [ ] Aktifkan auto-deploy ke Vercel (Python AI + Web)
- [ ] Run database migrations di production Supabase
- [ ] Switch ke `BINANCE_TESTNET=false`
- [ ] Monitor 24 jam pertama live

### 5.6 Post-Deployment Monitoring (Minggu pertama live)
- [ ] Setup UptimeRobot untuk semua endpoints
- [ ] Review Telegram notifications setiap 12 jam
- [ ] Cek `heartbeat_log` — ada failure yang berulang?
- [ ] Cek `mistakes` table — ada pattern mistake yang dominan?
- [ ] Review `daily_performance` — profit target tercapai?
- [ ] Dokumentasikan hasil di `CHANGELOG.md`

---

## 📌 Quick Reference: File yang Harus Dibuat

### Supabase
```
supabase/
├── migrations/
│   ├── 001_core_tables.sql
│   ├── 002_trading_tables.sql
│   ├── 003_performance_tables.sql
│   └── 004_rls_policies.sql
└── seed.sql
```

### Rust Core
```
core/
├── Cargo.toml
└── src/
    ├── main.rs, config.rs, error.rs
    ├── database/mod.rs
    ├── websocket/mod.rs
    ├── buffer/mod.rs
    ├── analysis/{mod,snd,elliott}.rs
    ├── ai_client/mod.rs
    ├── execution/{mod,binance_client}.rs
    ├── risk/mod.rs
    ├── telegram/mod.rs
    └── api/mod.rs
```

### Python AI
```
ai/
├── pyproject.toml, Dockerfile
├── main.py, config.py
├── models/{requests,responses}.py
├── services/{llm,rag,mistake_analyzer}.py
├── routers/trading.py
├── database/supabase_client.py
└── tests/
```

### Next.js Web
```
web/
├── src/app/{layout,page}.tsx
├── src/app/{dashboard,trades,mistakes,performance,settings}/page.tsx
├── src/components/layout/{TopBar,Sidebar}.tsx
├── src/components/{WatchlistPanel,MainChart,PositionsPanel}.tsx
├── src/hooks/use{LiveData,Positions,Trades,Performance}.ts
└── src/lib/{supabase,api}.ts
```

---

## 🚀 Cara Mulai Coding

```bash
# 1. Clone repo
git clone https://github.com/yogisyahroni811-lang/BOTBINANCE.git
cd BOTBINANCE

# 2. Copy env
cp .env.example .env.local
# → Edit .env.local dengan API keys kamu

# 3. Mulai dari database
# Buat migrations di supabase/migrations/

# 4. Setup Rust core
cargo init core --name botbinance-core

# 5. Run development
docker-compose up --build
```

---

*Last updated: 2026-04-08 | Track progress dengan mencentang setiap task*
