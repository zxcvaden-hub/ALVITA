# Apps Script 部署說明

請以 `Code-combined.gs` 為準：它包含所有 API、資料表、房間鎖定與安全函式，直接一次貼入綁定在私人 Google 試算表的 Apps Script 專案即可。

分檔名稱保留在此資料夾，方便依職責閱讀；避免同時貼入分檔註解版與合併版，否則可能造成函式重複。

部署前依根目錄 README 的步驟執行 `setupSpreadsheet()`。Web App 必須「以我身分執行」，前端則填入部署作業提供的 `/exec` URL。試算表分享權限不需要給 GitHub Pages 或一般網友。

`verifyPin` 會比對 `Users.pin_hash` 與 SHA-256；請只從可信管理流程寫入雜湊值，絕對不要在前端或試算表放 PIN 明碼。
