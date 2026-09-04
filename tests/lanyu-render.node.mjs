globalThis.localStorage={
  store:{},
  getItem(key){return Object.prototype.hasOwnProperty.call(this.store,key)?this.store[key]:null},
  setItem(key,value){this.store[key]=String(value)},
  removeItem(key){delete this.store[key]}
};
let html="";
const app={innerHTML:"",querySelector(){return null},querySelectorAll(){return []}};
globalThis.document={
  querySelector(sel){return sel==="#app"?app:sel==="#toast"?{textContent:"",classList:{add(){},remove(){}}}:null},
  querySelectorAll(){return []}
};
const {state}=await import("../js/state.js");
const ui=await import("../js/ui.js");
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

state.userId="chien";
ui.renderLanyu({date:"2026-09-04",day:{date:"2026-09-04",missions:[{id:"d0904-a",emoji:"🐠",text:"找一隻魚代表我"}]},bottle:{},inbox:[],stats:{}});
assert(app.innerHTML.includes("自己下指令"),"chien sees custom mission button");
assert(app.innerHTML.includes("lanyu-pick:custom"),"custom pick action exists");

ui.renderLanyu({date:"2026-09-04",pendingMissionId:"custom",day:{date:"2026-09-04",missions:[]},bottle:{},inbox:[],stats:{}});
assert(app.innerHTML.includes("lanyu-custom-mission-form"),"custom mission form appears");
assert(app.innerHTML.includes("maxlength=\"30\""),"custom mission is limited to 30");

state.userId="ken";
ui.renderLanyu({
  date:"2026-09-04",
  bottle:{theirs:{exists:true,date:"2026-09-04",opened:false,sender_name:"阡阡"}},
  inbox:[{date:"2026-09-03",opened:false,sender_name:"阡阡"}],
  stats:{}
});
assert(app.innerHTML.includes('data-date="2026-09-04"'),"today bottle has data-date");
assert(app.innerHTML.includes('data-date="2026-09-03"'),"older bottle has data-date");
assert(app.innerHTML.includes('data-action="lanyu-open"'),"open uses action without colon date");
assert(!app.innerHTML.includes("連上海浪"),"full-page loading copy is not used on the usable page");
console.log("lanyu render ok");
