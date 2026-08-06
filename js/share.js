import {roomUrl} from "./room-manager.js";
const messages={dinner:"🍽️ 我已經偷偷選好今晚想吃什麼了，換你回答！完成後才會公布結果。",activity:"🏠 今天要做什麼？我已經選好了，來看看我們有沒有默契。",compatibility:"🎮 我開了一場大爺與阡阡默契挑戰，等你加入！",likely:"😆 我已經回答誰比較可能了，換你選！",guess:"💭 我已經留下答案，你猜得到嗎！"};
export async function shareRoom(room){const text=messages[room.subtype]||"我開了一個小房間，等你一起玩！",url=roomUrl(room);if(navigator.share){try{await navigator.share({title:"大爺與阡阡的生活遊樂場",text,url});return{shared:true}}catch(e){if(e.name==="AbortError")return{shared:false}}}await navigator.clipboard?.writeText(`${text}\n${url}`);return{copied:true,text,url}}
export async function copy(text){await navigator.clipboard.writeText(text)}
