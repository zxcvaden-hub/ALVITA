const key="couple-playground:";
export const storage={get:(name,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key+name))??fallback}catch{return fallback}},set:(name,value)=>localStorage.setItem(key+name,JSON.stringify(value)),remove:name=>localStorage.removeItem(key+name)};
export const getUser=()=>storage.get("user");
export const setUser=userId=>storage.set("user",userId);
const avoidKey="temporary-avoid";
export const getTemporaryAvoid=()=>{
 const now=Date.now(),saved=storage.get(avoidKey,{});
 const active=Object.fromEntries(Object.entries(saved).filter(([,expiresAt])=>Number.isFinite(Date.parse(expiresAt))&&Date.parse(expiresAt)>now));
 if(Object.keys(active).length!==Object.keys(saved).length)storage.set(avoidKey,active);
 return active;
};
export const setTemporaryAvoid=(id,days=7)=>{
 const entries=getTemporaryAvoid();
 entries[id]=new Date(Date.now()+days*86400000).toISOString();
 storage.set(avoidKey,entries);
 return entries[id];
};
