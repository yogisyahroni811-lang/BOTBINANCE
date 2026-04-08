# Product Requirements Document (PRD)
# Autonomous AI Trading Bot dengan Price Action Analysis

**Version:** 2.0  
**Date:** 2026-04-08  
**Status:** Final

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Core Features](#3-core-features)
4. [Technical Specifications](#4-technical-specifications)
5. [User Interface](#5-user-interface)
6. [Deployment & Infrastructure](#6-deployment--infrastructure)
7. [Security & Risk Management](#7-security--risk-management)
8. [Appendix](#8-appendix)

---

## 1. Executive Summary

### 1.1 Overview

Sistem trading futures cryptocurrency yang beroperasi autonomous 24/7, menggunakan analisis price action (Supply & Demand + Elliott Wave) dengan AI-powered decision making dan self-learning dari kesalahan.

### 1.2 Key Differentiators

| Aspek                    | Deskripsi                                              |
| ------------------------ | ------------------------------------------------------ |
| **Autonomous Operation** | Berjalan tanpa user login, state persistent di cloud   |
| **Price Action Focus**   | SND zones + Elliott Wave, bukan lagging indicators     |
| **Self-Learning**        | RAG-based mistake tracking, warning untuk setup serupa |
| **Multi-TF Independent** | Setiap timeframe analisis sendiri, no cross-reference  |
| **Telegram Integration** | Notifikasi real-time untuk semua events                |

### 1.3 Target Performance

| Metrik       | Target                                            |
| ------------ | ------------------------------------------------- |
| Latency      | <10ms (Rust core), <2s (AI analysis)             |
| Throughput   | 30 symbols × 5 timeframes = 150 data streams      |
| Availability | 99.9% dengan auto-recovery                        |
| Daily Target | Min 1% profit, max unlimited, circuit breaker -3% |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Vercel)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Web Dashboard │  │  Mobile View    │  │  Telegram Bot Interface     │  │
│  │   (Next.js)     │  │  (Responsive)   │  │  (Notification + Commands)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket / SSE / HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATION LAYER (Render)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Heartbeat Coordinator                                               │    │
│  │  • 60s interval ping ke semua services                              │    │
│  │  • Auto-restart failed services                                     │    │
│  │  • Alert admin jika persistent failure                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  State Manager (Redis + SQLite)                                      │    │
│  │  • Active positions (source of truth)                               │    │
│  │  • Pending orders queue                                             │    │
│  │  • Daily stats & mode                                               │    │
│  │  • User settings                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ gRPC / Internal API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE ENGINE (Render - Rust)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Market Data    │  │  Price Action   │  │  Execution Engine           │  │
│  │  Ingestor       │  │  Analyzer       │  │  (Binance Futures)          │  │
│  │  (WebSocket)    │  │  (SND + Elliott)│  │  • Bracket orders           │  │
│  │  • 30 symbols   │  │  • Independent  │  │  • Invalidation monitor     │  │
│  │  • 5 timeframes │  │    per TF       │  │  • Risk management          │  │
│  │  • Rolling 200  │  │  • Real-time    │  │  • Daily target tracker     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP / gRPC (on-demand)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI BRAIN (Vercel - Python)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  LLM Reasoning  │  │  RAG Engine     │  │  Mistake Analyzer           │  │
│  │  (OpenAI/Claude)│  │  • Per-TF embed │  │  • Auto-categorize loss     │  │
│  │  • Setup valid. │  │  • Similarity   │  │  • Generate lesson          │  │
│  │  • TP/SL sug.   │  │  • Warning sys  │  │  • Prevention tip           │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PostgreSQL
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER (Supabase)                              │
│  • trades (history)                                                          │
│  • mistakes (learning DB dengan vector embedding)                            │
│  • rag_memory (successful patterns)                                          │
│  • daily_performance (target tracking)                                       │
│  • heartbeat_log (monitoring)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Binance WebSocket → Rust Core → Rolling Buffer (200) → Analysis Trigger
                                                              │
                                    ┌─────────────────────────┼─────────────────┐
                                    │                         │                 │
                                    ▼                         ▼                 ▼
                              No Setup                    Setup Detected      Invalidation
                                    │                              │              │
                                    │                              ▼              │
                                    │                    ┌─────────────────┐     │
                                    │                    │  Send ke Python │     │
                                    │                    │  AI Analysis    │     │
                                    │                    └────────┬────────┘     │
                                    │                             │              │
                                    │                    ┌────────▼────────┐     │
                                    │                    │  LLM + RAG      │     │
                                    │                    │  Validation     │     │
                                    │                    └────────┬────────┘     │
                                    │                             │              │
                              ┌─────┴──────┐            ┌────────┴────────┐     │
                              │            │            │                 │     │
                              ▼            ▼            ▼                 ▼     ▼
                            WAIT       REJECT      VALID (Signal)    EXECUTE  CLOSE
                                           │            │                 │     │
                                           │            ▼                 ▼     │
                                           │    ┌─────────────────┐  ┌────────┐ │
                                           │    │  Position Open  │  │Telegram│ │
                                           │    │  TP/SL Bracket  │  │Notify  │ │
                                           │    └─────────────────┘  └────────┘ │
                                           └─────────────────────────────────────┘
```

---

## 3. Core Features

### 3.1 Rolling Candle Buffer

| Spesifikasi            | Detail                      |
| ---------------------- | --------------------------- |
| **Size**               | 200 candles per timeframe   |
| **Timeframes**         | 15m, 30m, 1H, 4H, 1D        |
| **Update**             | FIFO (pop front, push back) |
| **Memory**             | ~50KB per symbol per TF     |
| **Total (30 symbols)** | ~7.5MB hot memory           |

### 3.2 Supply & Demand Detection

**Zone Creation:**
```
├── Base: 3+ candles consolidation (range < ATR)
├── Impulse: Strong break (>1.5x ATR) dengan volume spike
├── Zone boundaries: Base ±10%
└── Grading:
    ├── Grade A: Fresh (0 tests)
    ├── Grade B: Tested 1x + bounce (valid)
    ├── Grade C: Tested 2x+ (weakening, reduce size)
    └── Grade D: Broken (invalidate)
```

**Refresh:** Setiap 4H close, keep 10 best zones per TF

### 3.3 Elliott Wave Detection (Independent per TF)

| Komponen            | Algoritma                                              |
| ------------------- | ------------------------------------------------------ |
| **Pivot Detection** | ZigZag (depth=5, deviation=1.5%)                       |
| **Pattern Match**   | 5-wave impulse, 3-wave corrective                      |
| **Fib Validation**  | W2=50-61.8%, W3=161.8-261.8%, W4=38.2-50%             |
| **Invalidation**    | W2>100%, W4 overlap W1 (kecuali diagonal), W3 shortest |
| **Confidence**      | 0-100 berdasarkan fib alignment + structure clarity    |

### 3.4 Trading Setups (Entry Points)

| Setup                   | Kondisi                               | Confidence Base |
| ----------------------- | ------------------------------------- | --------------- |
| **W2 Completion**       | 50-61.8% retracement + SND Grade A/B  | 85%             |
| **W4 Completion**       | 38.2-50% retracement + SND confluence | 80%             |
| **Wave C Completion**   | 100-161.8% extension ABC + SND        | 75%             |
| **Counter-Trend Scalp** | Grade A zone, R:R >1:3, size 50%     | 65%             |

### 3.5 AI Validation Layer (LLM + RAG)

**Trigger:** Setiap 15 menit (atau saat ada setup)

**Input:**
```
├── 200 candles history
├── Current zones
├── Recent trades log
└── Market regime (trending/ranging)
```

**Flow:**
1. Check recent trades (mistakes DB)
2. Check RAG memory (successful patterns)
3. Validate setup dengan LLM (context-aware)
4. Return confidence score (0-100)

**Thresholds:**
```
├── < 40: REJECT (no trade)
├── 40-60: CAUTION (manual review)
└── > 60: EXECUTE
```

### 3.6 Self-Learning System (Mistake Analyzer)

**Trigger:** Setiap kali posisi ditutup (profit atau loss)

**Mistake Categories:**
```
├── EARLY_ENTRY: Entry sebelum zone tercapai
├── LATE_ENTRY: Entry setelah optimal zone
├── MISSED_INVALIDATION: Tidak close saat wave break
├── GRADE_C_TRAP: Zone tested 2x+ tidak reliable
├── FAKEOUT_REACTION: Entry saat wick tanpa confirmation
├── WRONG_WAVE_COUNT: Miscount wave structure
├── COUNTER_TREND_LOSS: Melawan higher TF trend
└── SIZE_TOO_BIG: Position size >8% dengan loss besar
```

**Learning Pipeline:**
1. Analyze loss → Categorize → Generate lesson
2. Create embedding dari market context saat entry
3. Store ke mistakes table (pgvector)
4. Notify Telegram: "New lesson learned"
5. Future similar setup: Warning dengan prevention tip

**Contoh Output:**
> "Trade #456 (Loss): You bought at peak consolidation (same as mistake #123).
> Improvement: Wait for impulse break (>1.5x ATR).
> Prevention Tip: 'Jangan FOMO saat base formation.'"

### 3.7 Dynamic TP/SL Calculation

**Take Profit (TP):**
```
├── Zone-based: 1.5x - 3x ATR dari entry
├── Multi-target: 3 level TP (25%, 50%, 100% position)
└── Trailing: Geser TP ke breakeven saat 1R profit
```

**Stop Loss (SL):**
```
├── Zone-based: 0.5x - 1x ATR di luar zone
├── Max risk: 2% dari total capital
└── Breakeven: Geser ke entry saat 1R profit
```

### 3.8 Risk Management

| Parameter             | Aturan                                                                |
| --------------------- | --------------------------------------------------------------------- |
| **Position Size**     | 2-5% per trade (max 8% saat confidence >80%)                         |
| **Max Loss per Day**  | 6% dari total capital                                                 |
| **Stop Loss**         | 1.5x ATR di luar zone, atau wave invalidation level                   |
| **Take Profit**       | 1:2 R:R minimum, atau next resistance/support level                   |
| **Trailing Stop**     | Breakeven saat 1:1 tercapai, trailing 50% profit setelah 1:2 tercapai |
| **Max Open Trades**   | 3 (kecuali untuk scalping dengan R:R >1:3)                           |
| **Max Drawdown**      | 20% dari total capital → auto-stop trading                            |

---

## 4. Technical Specifications

### 4.1 Project Structure

```
/tradingbot
├── /core/                   # Rust core (websocket, engine)
│   ├── src/main.rs
│   ├── src/engine.rs        # Trading logic
│   ├── src/buffer.rs        # Rolling buffer
│   ├── src/zones.rs         # S&D detection
│   └── src/risk.rs          # Risk management
├── /ai/                     # Python AI services
│   ├── main.py              # API entry point
│   ├── services/llm_service.py
│   ├── services/rag_service.py
│   ├── services/mistake_analyzer.py
│   └── data/mistakes.db     # SQLite (vector-enabled)
├── /web/                    # Next.js Dashboard
│   ├── app/dashboard/page.tsx
│   ├── app/trades/page.tsx
│   ├── app/mistakes/page.tsx
│   └── components/ZoneChart.tsx
├── config/
│   ├── symbols.json         # 30 symbols
│   ├── timeframes.json      # 15m, 30m, 1H, 4H, 1D
│   └── settings.json        # Risk params
├── .env.local               # API keys
└── docker-compose.yml       # Multi-container setup
```

### 4.2 Technology Stack

**Rust (Core):**
```
├── tokio: Async runtime
├── binance-rs: WebSocket client
├── ta: Technical analysis library
├── serde: Serialization
└── reqwest: HTTP client (to Python)
```

**Python (AI):**
```
├── FastAPI: API framework
├── sentence-transformers: RAG embeddings
├── chromadb: Vector database
├── openai: LLM integration
└── pandas: Data manipulation
```

**Next.js (Web):**
```
├── React 18+ with Server Components
├── Tailwind CSS + Shadcn UI
├── Recharts: Charting
└── Vercel Edge Functions: Deployment
```

**Database:**
```
├── PostgreSQL (Supabase): Main DB
├── SQLite (ChromaDB): Vector embeddings
└── Redis: Caching (optional)
```

### 4.3 API Specification

**Internal: Rust ↔ Python (gRPC)**

```protobuf
service TradingBridge {
  rpc AnalyzeSetup(SetupRequest) returns (SignalResponse);
  rpc ExecuteSignal(ExecuteRequest) returns (ExecutionResponse);
  rpc ReportTrade(TradeResult) returns (Ack);
  rpc HealthCheck(HealthRequest) returns (HealthResponse);
}

message SetupRequest {
  string symbol = 1;
  string timeframe = 2;
  int64 timestamp = 3;
  SNDZone zone = 4;
  WaveContext wave = 5;
  double current_price = 6;
  repeated Candle recent_candles = 7;
}

message SignalResponse {
  string signal_id = 1;
  bool valid = 2;
  string action = 3;       // LONG, SHORT, WAIT
  int32 confidence = 4;
  double entry_price = 5;
  double stop_loss = 6;
  double take_profit_1 = 7;
  double take_profit_2 = 8;
  double size_pct = 9;
  string reasoning = 10;
  repeated string warnings = 11;  // Dari RAG
}

message ExecuteRequest {
  string signal_id = 1;
  string action = 2;
  double entry_price = 3;
  double stop_loss = 4;
  double take_profit_1 = 5;
  double take_profit_2 = 6;
  double size_pct = 7;
}

message ExecutionResponse {
  string order_id = 1;
  bool success = 2;
  string status = 3;        // NEW, FILLED, REJECTED
  string error_message = 4;
  double executed_price = 5;
  double executed_size = 6;
}

message TradeResult {
  string signal_id = 1;
  string order_id = 2;
  string status = 3;        // TP1, TP2, SL, REJECTED
  double realized_pnl = 4;
  double realized_pnl_pct = 5;
  double remaining_qty = 6;
  string reason = 7;
}

message HealthResponse {
  bool ok = 1;
  string version = 2;
  int32 active_connections = 3;
  string database_status = 4;
  string ai_status = 5;
}
```

**External: REST API**

| Endpoint              | Method          | Description                     |
| --------------------- | --------------- | ------------------------------- |
| `/api/v1/symbols`     | GET/POST/DELETE | Manage watchlist (max 30)       |
| `/api/v1/positions`   | GET             | Open positions                  |
| `/api/v1/trades`      | GET             | History dengan mistake analysis |
| `/api/v1/performance` | GET             | Daily stats & equity growth     |
| `/api/v1/emergency`   | POST            | Close all positions             |
| `/health`             | GET             | System status                   |

### 4.4 Database Schema (Supabase)

```sql
-- Core tables
symbols(id, symbol, is_active, priority, added_at)
candles(id, symbol_id, timeframe, timestamp, o, h, l, c, v)
snd_zones(id, symbol_id, timeframe, zone_type, price_high, price_low, grade, test_count, is_active)
elliott_waves(id, symbol_id, timeframe, current_wave, wave_type, invalidation_price, confidence)

-- Trading & Learning
trades(id, symbol_id, entry_timeframe, entry_time, entry_price, direction, size_usd, leverage,
       setup_type, grade_at_entry, exit_time, exit_price, exit_reason, pnl_usd, pnl_pct, outcome)
mistakes(id, trade_id, mistake_type, severity, market_context JSONB, what_happened,
         what_should_happen, prevention_tip, embedding VECTOR(768), similar_loss_count)

-- Performance
daily_performance(date, starting_equity, ending_equity, pnl_pct, trades_count, wins, losses,
                  win_rate, avg_rr, mode, target_reached)
heartbeat_log(id, service, timestamp, status, latency_ms, message)
```

### 4.5 Notification Specification (Telegram)

| Event                  | Priority | Silent | Format                        |
| ---------------------- | -------- | ------ | ----------------------------- |
| Entry executed         | High     | No     | 🎯 ENTRY dengan detail setup  |
| TP1/TP2/TP3 hit        | High     | No     | ✅ TP dengan PnL              |
| SL hit                 | Critical | No     | ⛔ SL dengan mistake category |
| Invalidation confirmed | Critical | No     | ⚠️ Close reason              |
| Mistake logged         | Medium   | Yes    | 🧠 Lesson learned             |
| Daily recap            | Low      | Yes    | 📊 Performance summary        |

### 4.6 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  Vercel                                      │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Next.js Frontend           │  │  Python AI Service (Edge Function)   │  │
│  │  • Dashboard                │  │  • LLM Reasoning                     │  │
│  │  • Real-time updates        │  │  • RAG Engine                        │  │
│  │  • WebSocket                │  │  • Mistake Analyzer                  │  │
│  └──────────────┬──────────────┘  └──────────────┬───────────────────────┘  │
│                 │                                │                          │
│                 │ HTTP/WebSocket                 │                          │
│                 ▼                                ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Supabase (PostgreSQL)                                               │   │
│  │  • trades table                                                      │   │
│  │  • mistakes table (with pgvector extension)                          │   │
│  │  • daily_performance table                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.7 Performance Targets

| Metric          | Target   | Measurement     |
| --------------- | -------- | --------------- |
| Uptime          | 99.9%    | UptimeRobot     |
| Response time   | < 500ms  | Load testing    |
| Trade execution | < 200ms  | Benchmarking    |
| Chart load      | < 1s     | Browser testing |
| AI response     | < 300ms  | Benchmarking    |
| Database query  | < 50ms   | Query profiling |

---

## 5. User Interface

### 5.1 Design System

**Colors:**
```
├── Background:    #0b0e11 (Binance dark)
├── Surface:       #1e2329
├── Border:        #2b3139
├── Text Primary:  #eaecef
├── Text Secondary:#848e9c
├── Long:          #0ecb81
├── Short:         #f6465d
└── Accent:        #f0b90b
```

**Typography:**
```
├── Headings: JetBrains Mono
├── Body:     Inter
└── Numbers:  Tabular nums
```

**Spacing:** 4px base unit, compact density  
**Borders:** 1px solid, 4px radius

### 5.2 Page Specifications

#### Dashboard (Main View)

Real-time chart dengan:
- Candlestick overlay
- SND zones (colored by grade)
- Elliott wave count
- Current price line
- Trade markers (entry/TP/SL)

Right sidebar:
- Active watchlist (30 max)
- Current positions
- Quick stats (24h PnL, win rate)
- System status indicators

#### Trade History (Table)

**Columns:** Time (entry/exit) | Symbol | Direction | Setup type | Grade | R:R | PnL (USD + %) | Outcome (Win/Loss/Breakeven)

**Filters:** Time range | Symbol | Outcome | Setup type

#### Mistakes Log (Table)

**Columns:** Time | Trade ID | Mistake category | Severity | What happened | Prevention tip | Similar losses

**Filters:** Category | Severity | Date range

#### Performance (Charts)
- Equity curve (line chart)
- Daily PnL (bar chart)
- Win rate over time
- Average R:R
- Trade distribution by setup

#### Settings
- API keys management
- Telegram bot configuration
- Watchlist management
- Risk parameters
- Notification preferences

### 5.3 Layout Structure

**Desktop (3-panel):**
```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR: Symbol selector, Equity, Daily PnL                 │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  LEFT 25%    │      CENTER 50%              │  RIGHT 25%    │
│  Watchlist   │      Main Chart              │  Positions    │
│  + Alerts    │      + Execution             │  + Growth     │
│              │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

**Mobile (single column, bottom sheet):**
```
┌─────────────────────────────┐
│  Chart (60% screen)         │
├─────────────────────────────┤
│  [Drag Handle]              │
├─────────────────────────────┤
│  Positions / Entry Sheet    │
├─────────────────────────────┤
│  Bottom Nav                 │
└─────────────────────────────┘
```

### 5.4 Chart Specification

| Feature      | Implementasi                                                              |
| ------------ | ------------------------------------------------------------------------- |
| **Library**  | TradingView Lightweight Charts                                            |
| **Size**     | ~40KB gzipped                                                             |
| **Overlays** | SND zones (rectangle), Elliott labels (text), AI prediction (dotted line) |
| **Gestures** | Pan, pinch zoom, long press (entry), double tap (reset)                   |
| **Update**   | Real-time SSE, 200ms throttle                                             |

### 5.5 Entry Sheet (Mobile)

| Element        | Behavior                                                              |
| -------------- | --------------------------------------------------------------------- |
| **Trigger**    | Long press on chart atau "New Trade" button                           |
| **Fields**     | Symbol, Direction (Buy/Sell), Setup Type (SND/Elliott), Size (USD/%)  |
| **Validation** | Zod schema, real-time validation                                      |
| **Actions**    | "Preview" (show TP/SL), "Execute" (send to backend)                  |
| **State**      | Loading, Success, Error states dengan toast notifications             |

---

## 6. Deployment & Infrastructure

### 6.1 Stack

| Layer        | Service      | Plan        | Cost                                        |
| ------------ | ------------ | ----------- | ------------------------------------------- |
| Client       | Vercel       | Hobby       | Free                                        |
| Core         | Render       | Web Service | \$7/month atau Free (heartbeat workaround)  |
| Database     | Supabase     | Free Tier   | Free (500MB, 2GB bandwidth)                 |
| Notification | Telegram Bot | API         | Free                                        |

### 6.2 Heartbeat Configuration

```
// 60s interval
Services to ping:
├── Rust Core (self)
├── Python AI (Vercel health endpoint)
├── Supabase (DB connection)
└── Binance WebSocket (connection alive)

Failure handling:
├── 1st failure: Immediate retry
├── 2nd failure: Log warning
├── 3rd failure: Alert admin + trigger failover
└── Persistent: Restart service container
```

### 6.3 Monitoring & Alerting

**Metrics to track:**
```
├── Uptime (99.9% target)
├── Response time (< 500ms)
├── Trade accuracy (80%+)
├── Win rate (60%+)
├── Average R:R (2:1+)
├── Profit factor (1.5+)
├── Active users
└── System health (CPU, memory, DB connections)
```

**Alert thresholds:**
| Metric          | Threshold       | Channels                      |
| --------------- | --------------- | ----------------------------- |
| Uptime          | < 99%           | Telegram (primary)            |
| Response time   | > 1s            | Email (backup)                |
| Win rate        | < 50%           | SMS (critical only)           |
| Profit factor   | < 1.0           | Telegram                      |
| Critical errors | 5+ in 1 hour    | All channels                  |
| Security events | Any             | All channels                  |

### 6.4 Autonomous Operation

**User Logout:**
```
├── State persisted ke Redis/Supabase
├── Trading continues dengan settings terakhir
├── Telegram notifications tetap aktif
└── Reconnect: Sync state saat login kembali
```

**Critical Events (selalu notify):**
```
├── SL hit
├── Invalidation confirmed
├── Daily loss limit (-3%)
└── System failure
```

### 6.5 Implementation Roadmap

**Phase 1: Foundation (Week 1-2)**
- [ ] Setup Rust + Python + Supabase
- [ ] Implement WebSocket data pipeline
- [ ] Build SND detection engine
- [ ] Build Elliott Wave detection
- [ ] Create Telegram bot
- [ ] Basic REST API
- [ ] Deploy MVP

**Phase 2: AI Integration (Week 3-4)**
- [ ] Setup Python AI services
- [ ] Implement RAG dengan ChromaDB
- [ ] Integrate LLM (OpenAI/Claude)
- [ ] Create Mistake Analyzer
- [ ] Connect Rust → Python via HTTP

**Phase 3: Dashboard (Week 5)**
- [ ] Build Next.js dashboard
- [ ] Add real-time chart dengan zones
- [ ] Implement trade history table
- [ ] Add mistakes log
- [ ] Deploy full stack

**Phase 4: Optimization & Testing (Week 6)**
- [ ] Implement dynamic TP/SL
- [ ] Optimize performance
- [ ] Add monitoring & alerting
- [ ] Backtesting & paper trading
- [ ] Bug fixes & final QA

---

## 7. Security & Risk Management

### 7.1 Authentication & Privacy

- OAuth 2.0 dengan Google
- JWT untuk session management
- Passwordless login (magic links)
- Rate limiting (100 req/min)
- 2FA option
- GDPR compliant
- User data encrypted at rest
- Anonymized analytics
- Data retention policy (7 years)

### 7.2 API Security

- Binance API keys: Environment variables, encrypted at rest
- Webhook validation: HMAC signature
- Rate limiting: 1200 req/minute (Binance), internal throttle
- Input validation (Zod/Pydantic)
- IP whitelisting
- HTTPS/TLS encryption
- No private key di client-side

### 7.3 Hard Limits (Non-negotiable)

| Parameter                | Value          | Enforcement                         |
| ------------------------ | -------------- | ----------------------------------- |
| Max equity per trade     | 10%            | Rust validation pre-execution       |
| Max leverage             | 10x            | Binance API limit                   |
| Max concurrent positions | 3              | Rust counter                        |
| Daily loss limit         | 3%             | Circuit breaker, pause trading      |
| Invalidation action      | Close position | Rust monitor, confirmation required |

### 7.4 Soft Limits (Configurable)

| Parameter              | Default | Trigger             |
| ---------------------- | ------- | ------------------- |
| Daily profit target    | 1%      | Continue normal     |
| Optimal profit target  | 5%      | Reduce size 50%     |
| Max profit target      | 10%     | Pause, review       |
| Mode switch            | Auto    | Based on daily PnL  |
| Max position size      | 5%      | Rust warning        |
| Max trades per day     | 10      | Rust counter        |
| Max consecutive losses | 3       | Rust counter        |

### 7.5 Risk Scoring

| Risk Factor             | Score | Action       |
| ----------------------- | ----- | ------------ |
| AI confidence < 40%     | +20   | Reject trade |
| AI confidence > 70%     | -10   | Bonus        |
| Market volatility > 2%  | +15   | Warning      |
| News event detected     | +25   | Reject       |
| RSI > 70 or < 30        | +10   | Warning      |
| Price > 200-day SMA     | +15   | Warning      |

### 7.6 Circuit Breakers

| Circuit Breaker  | Trigger                      | Action                  |
| ---------------- | ---------------------------- | ----------------------- |
| Daily loss       | -3% equity                   | Pause trading for 24h   |
| Volatility spike | >5% price change in 1h       | Pause trading for 1h    |
| API failure      | >3 consecutive errors        | Pause trading for 1h    |
| News event       | High-impact news detected    | Pause trading for 1h    |

### 7.7 Audit Trail

| Event             | Frequency    | Storage  |
| ----------------- | ------------ | -------- |
| Trade execution   | Every trade  | Database |
| AI decision       | Every trade  | Database |
| Risk check        | Every trade  | Database |
| Circuit breaker   | On trigger   | Database |
| System event      | Every event  | Database |

### 7.8 Compliance

| Requirement          | Implementation      |
| -------------------- | ------------------- |
| SEC disclaimer       | Display on UI       |
| Anti-money laundering| KYC verification    |
| Data privacy         | GDPR compliant      |
| Audit trail          | Immutable logs      |
| Risk disclosure      | User agreement      |
| Binance API terms    | Enforced by design  |

---

## 8. Appendix

### 8.1 Glossary

| Term             | Definisi                                          |
| ---------------- | ------------------------------------------------- |
| **SND**          | Supply & Demand zones                             |
| **RAG**          | Retrieval-Augmented Generation (AI dengan memory) |
| **TF**           | Timeframe                                         |
| **W4+B**         | Wave 4 completion dengan SND Grade B setup        |
| **Invalidation** | Price level yang membatalkan wave count           |
| **ATR**          | Average True Range (volatility indicator)         |
| **R:R**          | Risk:Reward ratio                                 |
| **FOMO**         | Fear of Missing Out (psychological bias)          |

### 8.2 Telegram Commands

| Command    | Deskripsi                          |
| ---------- | ---------------------------------- |
| /start     | Register & start bot               |
| /stop      | Pause notifications                |
| /status    | Current positions & equity         |
| /positions | Detail open positions              |
| /history   | Last 10 trades                     |
| /mistakes  | Last 5 mistakes & lessons          |
| /mode      | Check/change trading mode          |
| /recap     | Force daily report                 |
| /emergency | Close all positions immediately    |
| /help      | Command list                       |

### 8.3 AI Decision Flowchart

```
Start
  ↓
Market setup detected (SND + Elliott trigger)
  ↓
Check circuit breakers
  ├── Active → Reject
  └── Clear → Continue
  ↓
Load RAG memory (similar past setups)
  ↓
Analyze 200-candle market data
  ↓
Generate strategy + reasoning
  ↓
Calculate risk score
  ↓
Confidence check
  ├── < 40% → Reject (no trade)
  ├── 40-60% → Manual review (Telegram alert)
  └── > 60% → Execute
  ↓
Place bracket order (Entry + TP1 + TP2 + SL)
  ↓
Monitor position (live invalidation check)
  ↓
Position closed (TP / SL / Invalidation)
  ↓
Analyze result → Mistake Analyzer
  ↓
Update RAG memory + Telegram recap
```

### 8.4 Development Phase Summary

| Phase             | Duration | Deliverables                                  |
| ----------------- | -------- | --------------------------------------------- |
| 1. Core Engine    | Week 1-2 | Rust: WebSocket, rolling buffer, SND, Elliott |
| 2. AI Integration | Week 3   | Python: LLM, RAG, mistake analysis            |
| 3. Execution      | Week 4   | Rust: Orders, risk management, Telegram       |
| 4. UI & Polish    | Week 5   | Next.js: Dashboard, chart, mobile             |
| 5. Testing        | Week 6   | Backtesting, paper trading, bug fixes         |

### 8.5 Success Metrics

**Short-term (Month 1):**
```
├── 99.9% uptime
├── < 500ms response time
├── 10+ active users
└── 50+ trades executed
```

**Medium-term (Month 3):**
```
├── 80%+ trade accuracy
├── 2:1 reward/risk ratio
├── 10% weekly profit
└── 500+ trades executed
```

**Long-term (Month 6):**
```
├── 100%+ monthly ROI
├── 100+ active users
├── 1000+ trades executed
└── Scalable to 100+ symbols
```

### 8.6 Risks & Mitigations

| Risk                          | Mitigation                                          |
| ----------------------------- | --------------------------------------------------- |
| AI hallucination → bad trades | Confidence threshold: <40 REJECT, >60 EXECUTE       |
| WebSocket disconnect          | Auto-reconnect dengan exponential backoff           |
| Market regime change          | AI detects regime shift dan adjusts strategy        |
| Binance API rate limits       | Caching + batch processing + rate limiter           |
| High latency                  | Edge functions + local embeddings                   |
| Exchange downtime             | Heartbeat monitor + auto-alert + state persistence  |
| False signal (FOMO)           | RAG warning system + mistake prevention tips        |

### 8.7 Future Enhancements

**Phase 2 (Month 3-6):**
```
├── Multi-exchange support (Bybit, OKX)
├── Backtesting engine dengan historical data
├── Mobile app (React Native / Expo)
└── Advanced portfolio management
```

**Phase 3 (Month 6-12):**
```
├── Machine learning model fine-tuning dari trade history
├── Social trading (copy trade fitur)
├── AI-powered market news sentiment analysis
└── Scalable to 100+ symbols with dynamic watchlist
```

### 8.8 Next Steps

1. ✅ Approve PRD
2. 📁 Setup GitHub repository
3. 🏗️ Create initial project structure
4. 🚀 Start Phase 1 implementation (Rust core + WebSocket)
