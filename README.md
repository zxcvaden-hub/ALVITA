# 大爺與阡阡的生活遊樂場

手機優先、可用 LINE 分享邀請的兩人生活決策與互動遊戲網頁。前端可部署在 GitHub Pages；共同房間資料只透過私人 Google 試算表和 Apps Script Web App 儲存。

## 功能
- 單人晚餐快速推薦、雙人秘密晚餐配對與活動推薦
- 默契大考驗、誰比較可能、猜對方答案三種房間遊戲
- 8 秒輪詢等待狀態、24 小時到期、Token 驗證、分享/複製 LINE 邀請
- Mock 模式可直接使用；設定 `/exec` API 後切換正式共同房間

## 檔案結構
`css/` 是介面樣式，`js/` 是無框架程式，`data/` 是可單獨調整的人物/食物/活動/題庫資料，`config/config.js` 是唯一前端設定位置，`google-apps-script/Code-combined.gs` 是後端一次貼上版，`tests/` 有手動測試清單。

## 先在本機使用
直接以瀏覽器開啟 `index.html` 即可進入 Mock 模式。若瀏覽器因 `file://` 限制 ES Modules，請用 VS Code/Cursor 的 Live Server，或執行任何「只提供靜態檔案」的本機伺服器；不需要 Node.js 或帳號。

第一次請選身分。身分、深淺色設定與 mock 紀錄只存在此裝置的 localStorage；不會保存 PIN、原始對話或正式答案歷史。

## 部署 GitHub Pages
1. 在 GitHub 建立新的 repository，建議設為 Private；GitHub Pages 方案若需要公開 repository，請只公開本專案程式，不要加入個資。
2. 將這個資料夾所有檔案（包含 `.gitignore`）推送到 `main` 分支。
3. GitHub repository 的 **Settings → Pages**，選擇 **Deploy from a branch**、`main` 與 `/ (root)`，儲存。
4. 等待 GitHub 顯示網址，例如 `https://帳號.github.io/repository/`。這就是要傳給 LINE 的網站基底網址。

## 建立私人 Google 試算表與 API
1. 建立一份新的 Google 試算表，名稱例如「生活遊樂場私有資料」；**不要**把它設成公開或開啟「知道連結的任何人」。
2. 在試算表選 **擴充功能 → Apps Script**，刪除預設內容。
3. 開啟本專案的 `google-apps-script/Code-combined.gs`，完整複製貼上並儲存。
4. 在函式下拉選單選 `setupSpreadsheet`，按執行。第一次依指示授權；完成後會建立 Users、Rooms、Answers、Results、History、ActivityData、Logs 工作表與欄位。
5. 在 Apps Script 選 **部署 → 新增部署作業 → 網頁應用程式**。執行身分選「我」，存取權請依你 Google 帳號可用的最小範圍設定：兩人都需使用時通常選「所有人」；資料仍由 Apps Script 以部署者權限存取，試算表本身保持私人。
6. 按部署，複製結尾為 `/exec` 的網址。`/dev` 只供部署者登入測試，不可給 GitHub Pages 或另一支手機使用。
7. 在 `config/config.js` 將 `API_URL` 的提示文字替換成完整 `/exec` 網址並重新推送 GitHub Pages。
8. 到網站設定頁按「測試 API 連線」。成功後會顯示 Apps Script 模式。

### CORS 與連線排查
前端 POST 使用 `text/plain`，避免瀏覽器的 JSON 預檢請求；Apps Script Web App 的部署網址會重導至 Google 回應網域，通常可用。若失敗：
- 確認填的是最新部署的 `/exec`，不是 `/dev`、編輯頁或試算表網址。
- 確認重新部署版本且存取權允許另一人的未登入手機。
- 用無痕視窗打開 `/exec?action=healthCheck`；應回傳 JSON。
- 在網站設定頁測試並查看瀏覽器 Console 的網路錯誤。若公司網路封鎖 Google Apps Script，改用行動網路測試。

## 使用方式
兩支手機先各自選對的身分。第一人開啟晚餐或遊戲房間，按分享（支援 Web Share API；否則會複製文字和網址），貼到 LINE。第二人開啟連結並完成回答；雙方完成前 API 不會回傳另一人的 payload。完成後結果與歷史會寫到試算表。

## 調整內容
- 稱呼、姓名和首頁語氣：`data/couple-profile.js`
- 食物標籤與配對候選：`data/food-options.js`
- 至少 80 筆活動：`data/activity-options.js`
- 三款題庫：各 `*-questions.js`

不要在題庫放手機號碼、地址、公司機密、醫療/金融資訊、第三人私事或完整 LINE 原文。

## 隱私與安全
- 絕對不要把完整 LINE 對話、手機號碼、Google 憑證、`.env`、`credentials.json` 推送 GitHub；`.gitignore` 已列出常見檔案。
- 不要把試算表設公開，也不要把 PIN 明碼寫到 JavaScript。PIN 只應以 SHA-256 雜湊寫入 Users；目前 UI 不強制 PIN，可在正式啟用前自行由 Apps Script 設定使用者 PIN 雜湊並串接驗證流程。
- 房間 Token 至少 24 字元，試算表只保存其 SHA-256 雜湊。邀請連結仍屬私人資料，請只傳給對方。

## 更新與維護
題庫更新後重新推送 GitHub Pages；Apps Script 改動後必須建立/更新部署版本，`/exec` 才會載入新程式。使用 `deleteExpiredRooms` 可手動標記逾期房間。
