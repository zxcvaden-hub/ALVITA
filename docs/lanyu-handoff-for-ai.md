# ALVITA 蘭嶼功能交接（整份複製給其他 AI）

## 給承接 AI 的指令

請改善情侶 web app「大爺與阡阡的生活遊樂場」的**蘭嶼期間限定模組** UX。

使用者痛點（最高優先）：
1. **常常看不到任務**（尤其 `ken` 大爺看不到 `chien` 阡阡指派的任務，或跨日舊任務消失）
2. **點不開漂流瓶**（手機點「🐚 打開看看」沒反應、打開失敗、打開後又變回未開）
3. 手機點擊不穩、輪詢清掉輸入、後端未 redeploy 導致前後端規則不一致

請優先修可靠性與 UX，不要重寫整站。改完說明：改了哪些檔、怎麼驗證、是否需要重新部署 Apps Script。

- Repo：`https://github.com/zxcvaden-hub/alvita`
- 相關分支：`cursor/fix-lanyu-mobile-bottle-mission-3a93`

---

## 1. 專案與角色

| 項目 | 內容 |
|---|---|
| 身分 | `ken` = 大爺（在蘭嶼）；`chien` = 阡阡（在台北） |
| 前端 | 靜態站（GitHub Pages），ES modules |
| 後端 | Google Apps Script + 私人試算表 |
| 正式後端唯一貼上檔 | `google-apps-script/Code-combined.gs` |
| API | `config/config.js` → `CONFIG.API_URL`（`/exec`） |
| 輪詢 | `CONFIG.POLLING_INTERVAL` = 8000 |
| 時區 | `Asia/Taipei` |
| 旅程窗 | `2026-09-03` ~ `2026-09-11` |

### 必讀檔案

```
data/lanyu-missions.js
data/lanyu-messages.js
js/lanyu.js                 # taipeiDate / phase / status / polling
js/ui.js                    # renderLanyu()
js/app.js                   # 點擊、送瓶、開瓶、optimistic overlay
js/api.js                   # fetchApi + mock
js/state.js                 # lanyuMissionId / lanyuBottleDraft / lanyuOpenedBottles
css/lanyu.css
google-apps-script/Code-combined.gs
google-apps-script/README.md
tests/manual-test-checklist.md
assets/images/lanyu/
```

---

## 2. 產品規則（必須維持）

### 顯示階段 `lanyuPhase(taipeiDate())`
- `< 2026-09-03` → `hidden`
- `2026-09-03`～`2026-09-11` → `active`
- `> 2026-09-11` → `memory`（只看回憶，不可寫入）

### 任務
- 每天 3 個候選；前後端白名單必須一致（id 如 `d0903-a`）。
- **只有 chien** 可指派；**一天只能 1 次**。
- Sheet：`assigned_by=chien`, `assigned_to=ken`, `status=pending|completed`。
- **只有 ken** 可完成。
- **可完成過去日期任務**（後端 `completeLanyuMission` → `lanyuDate(date, false)`）。
- 指派仍必須是台北今天（`lanyuDate(date, true)`）。
- Ken UI 必須顯示今日 + 所有 pending 舊任務（後端 `open_missions`；前端也有 `timeline` fallback）。

### 漂流瓶
- 雙方**每天可無限次**送出（每次 add 新列）。
- 1～100 字（`[...message].length`）。
- 未開時收件人看不到 `message`。
- 可開過去日期；可用 `created_at` 指定某一封。
- `inbox` = 整趟旅程收到的瓶子；當日另有 `bottle.sent` / `bottle.incoming`。

### 統計
`assigned` / `completed` / `received` / `progress`

---

## 3. API 合約

`POST` JSON 到 `CONFIG.API_URL`：
```json
{ "action": "getLanyuState", "user_id": "ken", "date": "2026-09-05" }
```
成功 `{ success:true, data }`；失敗 `{ success:false, errorCode, message }`。  
前端 `js/api.js` 只回傳 `data`，失敗丟 Error（含 `code`）。

| action | 誰 | 參數 | 規則 |
|---|---|---|---|
| `getLanyuState` | 雙方 | `user_id`, `date?` | mission / open_missions / bottle / inbox / stats / timeline；cache ~30s |
| `assignLanyuMission` | chien | `user_id`, `date`, `mission_id` | 僅今天；一天一次 |
| `completeLanyuMission` | ken | `user_id`, `date` | 可跨日；回「今天」state |
| `sendLanyuBottle` | 雙方 | `user_id`, `date`, `message` | 僅今天寫入；可無限次 |
| `openLanyuBottle` | 雙方 | `user_id`, `date`, `created_at?` | 可開舊瓶 |
| `getLanyuHealth` | 設定頁 | — | 檢查兩張表 |
| `healthCheck` | 設定頁 | — | 見下方 |

### 確認後端已是新版
```json
{
  "status": "ok",
  "api_version": 3,
  "features": {
    "complete_past_lanyu_missions": true,
    "open_past_lanyu_bottles": true,
    "unlimited_lanyu_bottles": true
  }
}
```
沒有 `api_version`，或完成舊任務仍 `DATE_NOT_TODAY` /「只能操作台北今天」→ **還沒 redeploy**。

### `getLanyuState` 重點欄位
```json
{
  "date": "2026-09-05",
  "day": { "date": "...", "missions": [{ "id", "emoji", "text" }] },
  "mission": { "date", "mission_id", "mission_text", "status", "assigned_to", ... } | null,
  "open_missions": [ /* pending && assigned_to=ken */ ],
  "bottle": {
    "mine": {...}|null,
    "theirs": { "exists", "date", "from_user_id", "opened", "sender_name", "created_at", "message?" }|null,
    "sent": [],
    "incoming": []
  },
  "inbox": [],
  "stats": { "assigned", "completed", "received", "progress" },
  "timeline": [{ "date", "label", "mission", "bottles":[{ "sender_user_id" }] }]
}
```

---

## 4. Sheet schema

**LanyuMissions**  
`date, mission_id, mission_text, assigned_by, assigned_to, status, created_at, completed_at`

**LanyuBottles**  
`date, sender_user_id, receiver_user_id, message, created_at, opened_at`

注意：Sheet 的 date/created_at 可能是 Date 物件；後端用 `lanyuDateKey` / `lanyuTimeKey` 正規化。前端比對 `created_at` 格式不一致會導致「API 開了但 UI 找不到那一封」。

---

## 5. 前端行為（現況）

### 進入與輪詢
- `state.route === "lanyu"` → loading → `api.lanyuState(userId, taipeiDate())` → `renderLanyu`
- 每 8 秒輪詢；hidden 不刷
- focus 在 `#lanyu-bottle-form` 時非 force 刷新跳過
- visibility 回前景且在 lanyu route 會整頁 `render()`

### 本機 state（`js/state.js`）
- `userId`
- `lanyuMissionId`：chien 選任務暫存
- `lanyuBottleDraft`：送瓶草稿
- `lanyuOpenedBottles`：開瓶樂觀 overlay（key 優先 `created_at`）

### Chien
1. `lanyu-pick:<mission_id>` → 確認頁  
2. `lanyu-confirm:<id>` → `assignLanyuMission`  
3. 當天已指派後不可再指派

### Ken
1. 合併 `open_missions` + 今日 `mission`  
2. `lanyu-complete:<date>`  
3. 舊後端錯誤時 toast：請 redeploy `Code-combined.gs`

### 漂流瓶
1. `#lanyu-bottle-form` 永遠顯示；submit → `sendLanyuBottle`
2. Inbox 未開：`data-action="lanyu-open"` + `data-bottle-date` + `data-bottle-created`
3. 開成功寫入 `lanyuOpenedBottles`；找不到 opened+message 則 toast

### CSS（`css/lanyu.css`）
- 插圖 `pointer-events:none`
- panel 內 button/textarea/form：`z-index:2; touch-action:manipulation`
- 任務選項 min-height 48px；textarea 寬 100%、min-height 120px

---

## 6. 已知問題與根因

### A. 後端部署不同步（最常見）
Repo 已改，正式 `/exec` 仍舊。  
症狀：跨日完成失敗、一天只能丟一瓶、health 沒有 `api_version:3`。

部署步驟：
1. 試算表 → 擴充功能 → Apps Script  
2. 用 `google-apps-script/Code-combined.gs` **整份覆蓋**  
3. 儲存 → 部署 → 管理部署 → 編輯 → **新增版本** → 部署  
4. 手機硬重新整理

### B. 看不到任務
歷史原因：UI 只看「今天」mission；跨日 pending 會消失。  
現已有 `open_missions` + timeline fallback。仍需查：身分是否 ken、sheet pending、`assigned_to`、cache、API 是否回 `open_missions`。

### C. 點不開漂流瓶
歷史原因：同日重複列、cache、開瓶後 state 回「今天」需靠 inbox+created_at、overlay key 不一致、手機層級擋 click。  
另外：`js/app.js` 的 `applyLanyuOverlays` 曾出現函式提早 return 後又有非法 return，造成 **整個模組 SyntaxError、蘭嶼頁面掛掉**（分支上已修）。請勿再引入。

### D. 文件過時
README 可能仍寫「每日唯一漂流瓶」；實作已無限次。

### E. Mock vs Live
未設定合法 API URL 時走 mock（localStorage）。改規則時前後端 mock 一起改。

---

## 7. 建議改善方向

1. **可靠性**：開瓶樂觀更新+失敗回滾；`created_at` 正規化；輪詢勿覆蓋剛打開狀態；設定頁顯示 `api_version`
2. **任務可見性**：Ken 首屏清楚列「未完成（含舊日）」；空狀態區分「今天未指派」vs「有舊任務」
3. **漂流瓶**：多瓶獨立狀態；發送中 disable；失敗保留文字；按鈕夠大好點
4. **手機**：真機測 iPhone Safari / Android Chrome；減少整頁重渲 scroll 跳動
5. **不要**：公開試算表、PIN 上前端、同時貼分檔+Code-combined、為美化重做整站

---

## 8. 任務白名單（前後端需同步）

| 日期 | ids | 內容摘要 |
|---|---|---|
| 9/3 | d0903-a/b/c | 上車說一聲 / 旅程開始照 / 傳歌 |
| 9/4 | d0904-a/b/c | 魚代表我 / 最漂亮的東西 / 上岸傳訊 |
| 9/5 | d0905-a/b/c | 日出 / 海浪 10 秒 / 如果阡阡也在 |
| 9/6 | d0906-a/b/c | 海底想到我 / 最好看海底照 / 最白痴照 |
| 9/7 | d0907-a/b/c | 生日願望 / 第一杯敬我 / 荒謬生日照 |
| 9/8 | d0908-a/b/c | 出水報平安 / 最可愛的魚 / 潛水照 |
| 9/9 | d0909-a/b/c | 如果我也在的夕陽 / 夕陽配歌 / 最喜歡的事 |
| 9/10 | d0910-a/b/c | 跟海掰掰 / 最後一潛 / 最想帶我來哪 |
| 9/11 | d0911-a/b/c | 伴手禮 / 最後蘭嶼照 / 回台北第一件事 |

來源：`data/lanyu-missions.js` 與 `Code-combined.gs` 的 `LANYU_MISSIONS`。

---

## 9. 後端關鍵函式

`lanyuToday` / `lanyuDate` / `lanyuDateKey` / `lanyuTimeKey` / `lanyuViewBottle`  
`getLanyuState` / `assignLanyuMission` / `completeLanyuMission`  
`sendLanyuBottle` / `openLanyuBottle` / `clearLanyuCache`

---

## 10. 手動驗收

- [ ] healthCheck 有 `api_version:3` 與三個 features
- [ ] Chien 今日可指派一次；同日不可再指派
- [ ] Ken 看得到今日 + 過去 pending 並可完成
- [ ] 跨日完成不再「只能操作今天」
- [ ] 雙方今日可連續丟多封漂流瓶
- [ ] 未開看不到內文；點開後看到寄件者+內容
- [ ] 多封 inbox 可分別打開；重整後仍已開
- [ ] 輸入中輪詢不清草稿
- [ ] iPhone/Android 任務與「打開看看」可點
- [ ] 9/12 後只顯示回憶，不能寫入

---

## 11. 回報格式

1. 改了哪些檔案與行為  
2. 如何驗證「看得到舊任務」與「點得開漂流瓶」  
3. 是否需要使用者重新部署 Apps Script  
4. 尚未解決風險（cache、created_at、行動裝置）
