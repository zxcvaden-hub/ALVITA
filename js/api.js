import {CONFIG} from "../config/config.js";
import {isConfigured} from "./state.js";
import {storage} from "./storage.js";
import {LANYU_CUSTOM_MISSION_ID,LANYU_DAYS,getLanyuDay} from "../data/lanyu-missions.js";
import {lanyuStatus,taipeiDate,validateCustomMission} from "./lanyu.js";
const mockKey="mock-rooms";
const read=()=>storage.get(mockKey,{});
const write=v=>storage.set(mockKey,v);
async function fetchApi(action,payload={},retries=1){
  if(!isConfigured())return mock(action,payload);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(CONFIG.API_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...payload}),signal:controller.signal});
    const body=await response.json();
    if(!body.success)throw Object.assign(new Error(body.message),{code:body.errorCode});
    return body.data;
  }catch(error){
    console.error("API",action,error);
    const timeout=error.name==="AbortError";
    if(retries>0&&(!timeout||action==="getLanyuState"||action==="openLanyuBottle"))return fetchApi(action,payload,retries-1);
    throw new Error(timeout?"連線逾時，請再試一次。":error.message||"目前無法連接共同資料庫，請檢查網路或 Apps Script 設定。");
  }finally{clearTimeout(timer)}
}
const lanyuKey="mock-lanyu";
const lanyuRead=()=>storage.get(lanyuKey,{missions:{},bottles:[]});
const lanyuWrite=value=>storage.set(lanyuKey,value);
const partner=user=>user==="ken"?"chien":"ken";
const mockLanyuUser=user=>{if(!["ken","chien"].includes(user))throw new Error("INVALID_USER");};
const mockLanyuReadDate=date=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error("INVALID_DATE");};
const mockLanyuWriteDate=date=>{mockLanyuReadDate(date);if(date<"2026-09-03"||date>"2026-09-11")throw new Error("DATE_OUT_OF_RANGE");if(date!==taipeiDate())throw new Error("DATE_NOT_TODAY");};
const viewBottle=(bottle,user)=>{
  if(!bottle)return null;
  const opened=Boolean(bottle.opened_at);
  return {exists:true,date:bottle.date,from_user_id:bottle.sender_user_id,opened,sender_name:bottle.sender_user_id==="ken"?"大爺":"阡阡",...(bottle.sender_user_id===user||opened?{message:String(bottle.message??"")}:{})};
};
function mockLanyuState(data,p){
  const date=p.date,status=lanyuStatus(date),mission=data.missions[date]||null;
  const all=data.bottles.filter(b=>b.date===date);
  const mine=all.find(b=>b.sender_user_id===p.user_id);
  const incoming=all.find(b=>b.receiver_user_id===p.user_id);
  const timeline=LANYU_DAYS.map(day=>({date:day.date,label:day.label,mission:data.missions[day.date]||null,bottles:data.bottles.filter(b=>b.date===day.date).map(b=>({sender_user_id:b.sender_user_id}))}));
  const assigned=Object.keys(data.missions).length;
  const completed=Object.values(data.missions).filter(m=>m.status==="completed").length;
  const received=data.bottles.filter(b=>b.receiver_user_id===p.user_id).length;
  const inbox=data.bottles.filter(b=>b.receiver_user_id===p.user_id).reduce((list,bottle)=>{
    if(!list.some(item=>item.date===bottle.date))list.push(viewBottle(bottle,p.user_id));
    return list;
  },[]);
  return {date,day:{date,missions:getLanyuDay(date)?.missions||[]},mission,bottle:{mine,theirs:viewBottle(incoming,p.user_id)},inbox,stats:{assigned,completed,received,progress:status.progress},timeline};
}
function mockLanyu(action,p){
  const data=lanyuRead(),date=p.date;
  mockLanyuUser(p.user_id);
  if(action==="getLanyuState"){mockLanyuReadDate(date);return Promise.resolve(mockLanyuState(data,p));}
  if(action==="assignLanyuMission"){
    mockLanyuWriteDate(date);
    if(p.user_id!=="chien")throw new Error("這個遙控器是阡阡專用 😈");
    if(data.missions[date])throw new Error("今天已經選過任務了");
    let mission;
    if(p.mission_id===LANYU_CUSTOM_MISSION_ID){
      const text=validateCustomMission(p.mission_text);
      mission={id:LANYU_CUSTOM_MISSION_ID,emoji:"✍️",text};
    }else{
      mission=getLanyuDay(date)?.missions.find(m=>m.id===p.mission_id);
      if(!mission)throw new Error("這個任務不在今天的清單裡");
    }
    data.missions[date]={date,mission_id:mission.id,mission_text:`${mission.emoji} ${mission.text}`,assigned_by:"chien",assigned_to:"ken",status:"pending"};
    lanyuWrite(data);
    return Promise.resolve(mockLanyuState(data,p));
  }
  if(action==="completeLanyuMission"){
    mockLanyuWriteDate(date);
    const mission=data.missions[date];
    if(p.user_id!=="ken"||!mission)throw new Error("今天沒有可完成的任務");
    if(mission.status==="completed")throw new Error("今天的任務已完成");
    mission.status="completed";
    mission.completed_at=new Date().toISOString();
    lanyuWrite(data);
    return Promise.resolve(mockLanyuState(data,p));
  }
  if(action==="sendLanyuBottle"){
    mockLanyuWriteDate(date);
    const message=String(p.message||"").trim();
    if(!message||[...message].length>100)throw new Error("漂流瓶內容需介於 1 到 100 字");
    if(data.bottles.some(b=>b.date===date&&b.sender_user_id===p.user_id))throw new Error("今天已經丟過漂流瓶了");
    data.bottles.push({date,sender_user_id:p.user_id,receiver_user_id:partner(p.user_id),message,created_at:new Date().toISOString(),opened_at:""});
    lanyuWrite(data);
    return Promise.resolve(mockLanyuState(data,p));
  }
  if(action==="openLanyuBottle"){
    mockLanyuReadDate(date);
    const bottle=data.bottles.find(b=>b.date===date&&b.receiver_user_id===p.user_id);
    if(!bottle)throw new Error("今天沒有漂流瓶");
    bottle.opened_at=bottle.opened_at||new Date().toISOString();
    lanyuWrite(data);
    return Promise.resolve(mockLanyuState(data,{...p,date:taipeiDate()}));
  }
}
function mock(action,p){
  if(action==="getLanyuHealth")return Promise.resolve({LanyuMissions:true,LanyuBottles:true,mode:"mock"});
  if(["getLanyuState","assignLanyuMission","completeLanyuMission","sendLanyuBottle","openLanyuBottle"].includes(action))return mockLanyu(action,p);
  const rooms=read();
  if(action==="healthCheck")return Promise.resolve({mode:"mock",message:"Mock 模式正常"});
  if(action==="createRoom"){rooms[p.room.room_id]=p.room;write(rooms);return Promise.resolve(p.room)}
  if(action==="getRoom"){const r=rooms[p.room_id];if(!r)throw new Error("這個房間不存在，可能連結不完整。");if(r.room_token!==p.room_token)throw new Error("邀請連結驗證失敗。");return Promise.resolve(structure(r,p.user_id))}
  if(action==="submitAnswer"){const r=rooms[p.room_id];if(!r||r.room_token!==p.room_token)throw new Error("房間不存在或驗證失敗。");if(r.answers[p.user_id])throw new Error("你已經回答過囉。");r.answers[p.user_id]=p.payload;r.updated_at=new Date().toISOString();if(Object.keys(r.answers).length===2){r.status="completed";r.result=p.result||null;r.completed_at=r.updated_at}write(rooms);return Promise.resolve(structure(r,p.user_id))}
  if(action==="getPendingRooms")return Promise.resolve(Object.values(rooms).filter(r=>["waiting","completed"].includes(r.status)&&(r.creator_user_id===p.user_id||r.partner_user_id===p.user_id)).map(r=>structure(r,p.user_id)));
  if(action==="cancelRoom"){const r=rooms[p.room_id];if(r){r.status="cancelled";r.updated_at=new Date().toISOString();write(rooms)}return Promise.resolve({});}
  throw new Error("Mock 模式不支援此操作");
}
function structure(r,user){const safe={...r,answers:{}};if(r.status==="completed")safe.answers=r.answers;else if(r.answers[user])safe.answers[user]=r.answers[user];return safe}
export const api={call:fetchApi,health:()=>fetchApi("healthCheck"),createRoom:room=>fetchApi("createRoom",{room}),getRoom:(room_id,room_token,user_id)=>fetchApi("getRoom",{room_id,room_token,user_id}),submitAnswer:p=>fetchApi("submitAnswer",p),pending:user_id=>fetchApi("getPendingRooms",{user_id}),cancel:p=>fetchApi("cancelRoom",p),history:user_id=>fetchApi("getHistory",{user_id}),lanyuHealth:()=>fetchApi("getLanyuHealth"),lanyuState:(user_id,date)=>fetchApi("getLanyuState",{user_id,date}),lanyuAssign:p=>fetchApi("assignLanyuMission",p),lanyuComplete:p=>fetchApi("completeLanyuMission",p),lanyuSendBottle:p=>fetchApi("sendLanyuBottle",p),lanyuOpenBottle:p=>fetchApi("openLanyuBottle",p)};
