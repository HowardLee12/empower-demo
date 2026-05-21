# EMPOWER 首頁改版計畫

> 參考設計：`~/Downloads/現代/` (Claude Design — Hoops Youth Club)
> 目標：將首頁從簡單的日期+卡片列表，升級為專業聯賽入口網站

---

## 現有 vs 目標對照

| 區塊 | 現在 | 改版後 |
|------|------|--------|
| 導航 | DateStrip (7天滑動) | Week 切換 + Day grouping |
| 篩選 | 賽事 tabs only | 賽事 tabs + Status chips (全部/進行中/即將開始/已結束) |
| 比賽卡片 | 簡單卡片，左 accent bar | 6 欄 grid：時間・賽事 → 主隊 emblem+名 → 比分 → 客隊 → 場地 → 箭頭 |
| Hero | 無 | 左：深色統計面板（live/upcoming/隊伍數）；右：精選比賽 live card |
| 排名 | 僅在 /leagues/[id] 內 | 首頁底部：Standings 排名表 + Stat Leaders 卡片 |
| 對陣圖 | 無 | Cup Bracket（淘汰賽視覺化，未來擴充） |

---

## Phase 1：Match Cards + Day Grouping（最高優先）

### 目標
按天分組顯示比賽，每張卡片升級為資訊密集的橫向 grid layout。

### 要改的檔案
- `src/app/page.tsx` — 主要改動
- `src/components/MatchCard.tsx` — **新建**，獨立比賽卡片元件
- `src/components/DateStrip.tsx` — 可能移除或改為 Week 切換

### Match Card 設計規格
```
┌──────────────────────────────────────────────────────────────────┐
│ 18:30        │ 黑熊 U12  [emblem]  │  52 – 48  │  [emblem] 飛鷹 U12  │  信義運動中心  │  → │
│ League · MD3 │            Coach X  │           │  Coach Y             │  Court A       │    │
└──────────────────────────────────────────────────────────────────┘
```

Grid columns: `110px 1fr 130px 1fr 180px 36px`

### Day Group 設計
```
── Saturday · Apr 26 ──────────────────────── 3 games
  [MatchCard]
  [MatchCard]
  [MatchCard]

── Sunday · Apr 27 ────────────────────────── 1 game
  [MatchCard]
```

### 資料映射
| 設計欄位 | DB 來源 |
|----------|---------|
| 時間 | `sb_games.game_time` |
| 賽事標籤 | `sb_leagues.name` (via `game.league_id`) |
| 主隊名 | `sb_games.home_squad_name` |
| 客隊名 | `sb_games.away_squad_name` |
| 隊伍 emblem | `sb_organizations.logo_url` (fallback: `short_name` 漸層色塊) |
| 比分 | `sb_games.home_score` / `away_score` |
| 場地 | `sb_games.location` |
| 狀態 | `sb_games.status` (pending/live/completed) |

### Emblem Fallback 邏輯
目前 `sb_organizations` 有 `logo_url` 欄位（migration 009），但大多隊伍還沒上傳 logo。
需要 fallback 機制：
1. 有 `logo_url` → 顯示圖片
2. 無 logo → 用 `short_name` 前 2-3 字 + 隨機漸層色背景（類似設計中的 team emblem）

需要新增：`sb_organizations.color` 欄位（隊伍主色），用於 emblem 背景。
或者先 hardcode 一組預設漸層色，用 org_id hash 選色。

---

## Phase 2：Week 切換 + Status 篩選

### 目標
用 Last week / This week / Next week 切換取代 DateStrip 的 7 天滑動，
加上 All / Live / Upcoming / Finished 狀態篩選 chips。

### 要改的檔案
- `src/app/page.tsx` — 篩選邏輯
- `src/components/WeekSelector.tsx` — **新建**
- `src/components/StatusChips.tsx` — **新建**

### Week 計算邏輯
```typescript
// 以週一為起點計算「本週」
function getWeekRange(offset: number): { start: string, end: string } {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: toDateStr(monday),
    end: toDateStr(sunday),
  }
}
```

### Status 映射
| Chip | 對應 `sb_games.status` |
|------|----------------------|
| 全部 | 不篩選 |
| 進行中 | `live`（未來支援，目前暫無此狀態） |
| 即將開始 | `pending` |
| 已結束 | `completed` |

### UI 規格
```
┌─────────────────────────────────────────────────────────────┐
│  [上週]  [本週●]  [下週]          [全部] [進行中] [即將] [已結束]  │
└─────────────────────────────────────────────────────────────┘
```
- Week selector: pill group，active = yellow bg
- Status chips: 小圓點 + 文字，active = dark bg + white text

---

## Phase 3：Hero 精選比賽區塊

### 目標
首頁最上方顯示一個 split-panel hero：
- 左邊：深色面板，顯示本週統計（Live / Upcoming / 隊伍數）
- 右邊：當前最重要的比賽 live card（或最近完賽/即將開始的 featured game）

### 要改的檔案
- `src/app/page.tsx` — 加入 Hero section
- `src/components/HeroPanel.tsx` — **新建**
- `src/components/FeaturedGameCard.tsx` — **新建**

### Featured Game 選擇邏輯
```
1. 有 status=live 的比賽 → 選第一場
2. 沒有 live → 選今天最近的 upcoming
3. 都沒有 → 選最近一場 completed
```

### 統計面板
```
┌─────────────────────────┐
│  本週賽事                 │
│  Spring season heats up  │
│                          │
│  01    05     12         │
│  進行中  即將開始  參賽隊伍  │
└─────────────────────────┘
```

資料來源：
- 進行中：`games.filter(g => g.status === 'live').length`
- 即將開始：`games.filter(g => g.status === 'pending' && inThisWeek(g)).length`
- 參賽隊伍：從 `sb_league_squads` 或 games 的 unique squad count

---

## Phase 4：Standings 排名表

### 目標
首頁底部顯示各賽事的排名，從已完成的比賽結果計算。

### 要改的檔案
- `src/app/page.tsx` — 加入 Standings section
- `src/components/StandingsTable.tsx` — **新建**
- `src/lib/standings.ts` — **新建**，排名計算邏輯

### 排名計算邏輯
```typescript
interface StandingRow {
  squadId: string
  squadName: string
  orgShortName: string
  gamesPlayed: number
  wins: number
  losses: number
  pointsFor: number    // 總得分
  pointsAgainst: number // 總失分
  winPct: number
  lastFive: ('W' | 'L')[]  // 最近5場
}

function calculateStandings(
  games: GameRecord[],  // completed games only
  leagueId: string
): StandingRow[]
```

### 資料來源
全部從 `sb_games` WHERE `status = 'completed'` 計算：
- 勝場：`home_score > away_score` → home wins；反之 away wins
- PPG：累計得分 / 場次
- 近5場：最近5場 completed games 的 W/L

### UI 規格（參考設計的 standings table）
```
┌──────────────────────────────────────────────────────┐
│  #  │  隊伍          │  GP  │  W-L  │  PPG  │  近5場   │
│  1  │  [em] 黑熊 U12 │  10  │  9-1  │  78.4 │  WWWLW  │
│  2  │  [em] 飛鷹 U15 │  10  │  8-2  │  71.2 │  WLWWW  │
│ ... │                │      │       │       │         │
└──────────────────────────────────────────────────────┘
```

Top 3 rows 左邊有 yellow accent bar。
W = green dot, L = red dot。

---

## Phase 5：Stat Leaders 得分王

### 目標
顯示各統計項目的領先球員。

### 要改的檔案
- `src/components/StatLeaders.tsx` — **新建**
- `src/lib/stat-leaders.ts` — **新建**

### 計算邏輯
從 `sb_player_stats` 聚合：
```sql
-- 場均得分 leader
SELECT player_id, player_name, 
       AVG(points) as ppg,
       COUNT(*) as games
FROM sb_player_stats
GROUP BY player_id, player_name
HAVING COUNT(*) >= 3  -- 最少3場
ORDER BY ppg DESC
LIMIT 1
```

### 顯示項目
| 項目 | 欄位 | 單位 |
|------|------|------|
| 得分王 | AVG(points) | PPG |
| 助攻王 | AVG(assists) | APG |
| 籃板王 | AVG(off_rebounds + def_rebounds) | RPG |

### UI 規格
```
┌─────────────────────────────┐
│  得分王              22.4   │
│  王小明              PPG    │
│  [em] 黑熊 · #1             │
├─────────────────────────────┤
│  助攻王               7.8   │
│  陳建宏              APG    │
│  [em] 黑熊 · #7             │
├─────────────────────────────┤
│  籃板王               9.6   │
│  周育德              RPG    │
│  [em] 飛鷹 · #3             │
└─────────────────────────────┘
```

---

## Phase 6：Cup Bracket 對陣圖（未來）

### 目標
為淘汰賽制（正式錦標賽）顯示視覺化對陣圖。

### 需要新增的 DB 結構
```sql
-- 淘汰賽對陣
CREATE TABLE sb_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES sb_leagues(id),
  round TEXT NOT NULL,        -- 'QF', 'SF', 'FINAL'
  match_number INTEGER,       -- 1, 2, 3, 4
  home_squad_id UUID REFERENCES sb_squads(id),
  away_squad_id UUID REFERENCES sb_squads(id),
  game_id UUID REFERENCES sb_games(id),  -- 關聯到實際比賽
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled'
);
```

### 延後原因
- 需要新的資料模型
- Management 頁面需要新增 bracket 管理 UI
- 目前 EMPOWER 的比賽大多是循環賽制
- 可以等 EMPOWER 確認需要淘汰賽後再做

---

## 技術注意事項

### 色彩系統
沿用現有 Binance-inspired 色彩（globals.css）：
- `bn-yellow` #F0B90B — primary accent
- `bn-dark` #222126 — dark backgrounds
- `bn-ink` #1E2026 — text
- `bn-green` #0ECB81 — win indicator
- `bn-red` #F6465D — live / loss indicator
- `bn-slate` #848E9C — secondary text

新增需要：
- `bn-blue` #0EA5E9 — 用於 upcoming 狀態標示（設計中有用到）

### 需要的新 DB 欄位（migration 010）
```sql
-- 隊伍主色（用於 emblem fallback）
ALTER TABLE sb_organizations ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#F0B90B';
ALTER TABLE sb_organizations ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#FFD000';
```

### 響應式設計
- Desktop: 完整 6 欄 grid match card
- Tablet (<1100px): 隱藏 venue 欄，5 欄
- Mobile (<640px): 改為垂直堆疊卡片（保持現有風格）

### 元件拆分原則
從 page.tsx 拆出獨立元件，每個 < 200 行：
- `MatchCard.tsx` — 單場比賽卡片
- `WeekSelector.tsx` — 週切換
- `StatusChips.tsx` — 狀態篩選
- `HeroPanel.tsx` — Hero 左面板
- `FeaturedGameCard.tsx` — Hero 右 live card
- `StandingsTable.tsx` — 排名表
- `StatLeaders.tsx` — 得分王卡片
- `TeamEmblem.tsx` — 隊伍 emblem（logo 或 fallback）

---

## 開發順序建議

```
Phase 1 (Match Cards + Day Grouping)
  └── TeamEmblem + MatchCard + page.tsx 改 day grouping
  └── 預估：1-2 小時

Phase 2 (Week + Status 篩選)
  └── WeekSelector + StatusChips + 篩選邏輯
  └── 預估：1 小時

Phase 3 (Hero)
  └── HeroPanel + FeaturedGameCard
  └── 預估：1-2 小時

Phase 4 (Standings)
  └── standings.ts + StandingsTable
  └── 預估：1-2 小時

Phase 5 (Stat Leaders)
  └── stat-leaders.ts + StatLeaders
  └── 預估：1 小時

Phase 6 (Cup Bracket) — 未來
  └── 需要新 migration + management UI
  └── 預估：3-4 小時
```

---

## 完成標準

- [ ] Phase 1: Match cards 以 day group 顯示，emblem fallback 正常
- [ ] Phase 2: Week 切換 + status 篩選功能正常
- [ ] Phase 3: Hero 區塊顯示本週統計 + featured game
- [ ] Phase 4: Standings 從 completed games 正確計算並顯示
- [ ] Phase 5: Stat leaders 從 player_stats 正確聚合
- [ ] Phase 6: Cup bracket（需 EMPOWER 確認需求後再做）
- [ ] 所有 phase 響應式設計正常（desktop + mobile）
- [ ] 頁面載入速度無明顯退步
