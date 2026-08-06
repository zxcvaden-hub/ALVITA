export const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
export const uid=(len=7)=>Array.from({length:len},()=>("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")[Math.floor(Math.random()*32)]).join("");
export const token=()=>crypto.getRandomValues(new Uint8Array(18)).reduce((s,n)=>s+n.toString(16).padStart(2,"0"),"");
export const now=()=>new Date().toISOString();
export const formatDate=s=>new Intl.DateTimeFormat("zh-TW",{dateStyle:"medium",timeStyle:"short"}).format(new Date(s));
export const normalize=s=>String(s).trim().toLowerCase().replace(/[\s，。！？、,.!?]/g,"").replace(/[０-９Ａ-Ｚａ-ｚ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0));
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
