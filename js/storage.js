const key="couple-playground:";
export const storage={get:(name,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key+name))??fallback}catch{return fallback}},set:(name,value)=>localStorage.setItem(key+name,JSON.stringify(value)),remove:name=>localStorage.removeItem(key+name)};
export const getUser=()=>storage.get("user");
export const setUser=userId=>storage.set("user",userId);
