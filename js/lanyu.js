import {LANYU_WINDOW,LANYU_CUSTOM_MISSION_LIMIT,getLanyuDay} from "../data/lanyu-missions.js";
import {CONFIG} from "../config/config.js";
let lanyuPoller;
export const taipeiDate=(date=new Date())=>new Intl.DateTimeFormat("en-CA",{timeZone:LANYU_WINDOW.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
export const lanyuPhase=(date=taipeiDate())=>date<LANYU_WINDOW.start?"hidden":date>LANYU_WINDOW.end?"memory":"active";
export const lanyuStatus=(date=taipeiDate())=>{const start=Date.parse(`${LANYU_WINDOW.start}T00:00:00Z`),end=Date.parse(`${LANYU_WINDOW.end}T00:00:00Z`),current=Date.parse(`${date}T00:00:00Z`),index=Math.max(0,Math.min(8,Math.round((current-start)/86400000))),progress=Math.max(0,Math.min(100,Math.round(index/8*100)));if(date>LANYU_WINDOW.end)return{date,progress:100,label:"❤️ 距離已經歸零"};if(date===LANYU_WINDOW.end)return{date,progress,label:"🚢 大爺今天回來了！"};if(date==="2026-09-10")return{date,progress,label:"❤️ 明天就回來了！"};return{date,progress,label:`❤️ 距離歸零還有 ${8-index} 天`};};
export const currentLanyuDay=()=>getLanyuDay(taipeiDate());
export const stopLanyuPolling=()=>{if(lanyuPoller)clearInterval(lanyuPoller);lanyuPoller=null;};
export function startLanyuPolling(refresh){stopLanyuPolling();lanyuPoller=setInterval(()=>{if(!document.hidden)refresh().catch(error=>console.error("Lanyu refresh",error));},CONFIG.POLLING_INTERVAL);}
export const countChars=text=>[...String(text??"")].length;
export const normalizeLanyuDate=value=>{const match=String(value??"").match(/\d{4}-\d{2}-\d{2}/);return match?match[0]:"";};
export function parseAction(value){
  const raw=String(value??"");
  const index=raw.indexOf(":");
  return index<0?{kind:raw,arg:""}:{kind:raw.slice(0,index),arg:raw.slice(index+1)};
}
export function localLanyuShell(userId,cached){
  const date=taipeiDate(),status=lanyuStatus(date),day=getLanyuDay(date)||{date,missions:[]};
  return {
    date,
    day,
    mission:cached?.mission||null,
    bottle:cached?.bottle||{},
    inbox:cached?.inbox||[],
    stats:cached?.stats||{assigned:0,completed:0,received:0,progress:status.progress},
    timeline:cached?.timeline||[],
    user_id:userId
  };
}
export function validateCustomMission(text){
  const value=String(text??"").trim();
  if(!value||countChars(value)>LANYU_CUSTOM_MISSION_LIMIT)throw new Error("自訂指令需介於 1 到 30 字。");
  return value;
}
