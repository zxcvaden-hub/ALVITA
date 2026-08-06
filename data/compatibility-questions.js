const prompts=["對方今天最想吃什麼？","對方心情不好時最希望怎麼被安慰？","誰比較常問「到了嗎」？","對方最不能接受哪種臨時通知？","週末突然放假，對方最想去哪裡？","對方現在最想要吃飯、睡覺、抱抱還是出去玩？","誰比較容易忘記帶東西？","誰比較常幫對方檢查工作內容？","誰比較容易擔心對方冷到或餓到？","對方最常用哪一個稱呼叫你？","對方累累時最想收到什麼？","兩人約會最容易先決定什麼？"];
const options=["吃飯飯","休息一下","一起散步","抱抱","大爺","阡阡","兩個人都會","都不會"];
export const COMPATIBILITY_QUESTIONS=Array.from({length:60},(_,i)=>({id:`c-${i+1}`,text:prompts[i%prompts.length]+(i>=prompts.length?`（默契題 ${i+1}）`:""),type:"choice",options:options.slice(i%4,i%4+4)}));
