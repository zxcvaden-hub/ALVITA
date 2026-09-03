# Apps Script 部署說明

請以 `Code-combined.gs` 為準：它包含所有 API、資料表、房間鎖定與安全函式，直接一次貼入綁定在私人 Google 試算表的 Apps Script 專案即可。

分檔名稱保留在此資料夾，方便依職責閱讀；避免同時貼入分檔註解版與合併版，否則可能造成函式重複。

部署前依根目錄 README 的步驟執行 `setupSpreadsheet()`。Web App 必須「以我身分執行」，前端則填入部署作業提供的 `/exec` URL。試算表分享權限不需要給 GitHub Pages 或一般網友。

`verifyPin` 會比對 `Users.pin_hash` 與 SHA-256；請只從可信管理流程寫入雜湊值，絕對不要在前端或試算表放 PIN 明碼。

## 蘭嶼期間限定功能

更新 `Code-combined.gs` 後，請再執行一次 `setupSpreadsheet()`；它會保留原有資料並新增 `LanyuMissions` 與 `LanyuBottles` 分頁。

接著在部署管理中建立新的 Web App 版本。請確認沿用既有的 `/exec` URL，前端不需要改設定檔。

蘭嶼資料只允許 2026-09-03 至 2026-09-11 的台北當日寫入。後端會驗證固定使用者、任務白名單、每日唯一指派／漂流瓶、100 字限制與收件人才可開啟漂流瓶。
