import {LANYU_WINDOW,getLanyuDay} from "../data/lanyu-missions.js";
export const taipeiDate=(date=new Date())=>new Intl.DateTimeFormat("en-CA",{timeZone:LANYU_WINDOW.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
export const lanyuPhase=(date=taipeiDate())=>date<LANYU_WINDOW.start?"hidden":date>LANYU_WINDOW.end?"memory":"active";
export const lanyuStatus=(date=taipeiDate())=>{const start=Date.parse(`${LANYU_WINDOW.start}T00:00:00Z`),end=Date.parse(`${LANYU_WINDOW.end}T00:00:00Z`),current=Date.parse(`${date}T00:00:00Z`),index=Math.max(0,Math.min(8,Math.round((current-start)/86400000))),progress=Math.max(0,Math.min(100,Math.round(index/8*100)));if(date>LANYU_WINDOW.end)return{date,progress:100,label:"❤️ 距離已經歸零"};if(date===LANYU_WINDOW.end)return{date,progress,label:"🚢 大爺今天回來了！"};if(date==="2026-09-10")return{date,progress,label:"❤️ 明天就回來了！"};return{date,progress,label:`❤️ 距離歸零還有 ${8-index} 天`};};
export const currentLanyuDay=()=>getLanyuDay(taipeiDate());
