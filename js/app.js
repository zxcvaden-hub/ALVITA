import {state,saveHistory,saveLanyuCache,isConfigured} from "./state.js";
import {setUser,storage,setTemporaryAvoid} from "./storage.js";
import {go,query} from "./router.js";
import {api} from "./api.js";
import {createRoom,submit,startPolling,stopPolling} from "./room-manager.js";
import {shareRoom} from "./share.js";
import {matchDinner,recommendActivities,recommendExercises} from "./decision-engine.js";
import {scoreGuess} from "./game-engine.js";
import {COMPATIBILITY_QUESTIONS} from "../data/compatibility-questions.js";
import {WHO_LIKELY_QUESTIONS} from "../data/who-likely-questions.js";
import {GUESS_PARTNER_QUESTIONS} from "../data/guess-partner-questions.js";
import {LANYU_CUSTOM_MISSION_ID} from "../data/lanyu-missions.js";
import {taipeiDate,startLanyuPolling,stopLanyuPolling,localLanyuShell,normalizeLanyuDate,parseAction,validateCustomMission} from "./lanyu.js";
import * as ui from "./ui.js";
const poolFor=room=>room.subtype==="compatibility"?COMPATIBILITY_QUESTIONS:room.subtype==="likely"?WHO_LIKELY_QUESTIONS:GUESS_PARTNER_QUESTIONS;
const seededOrder=(items,seed="room")=>[...items].map((item,index)=>({item,key:[...`${seed}-${index}`].reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,0)})).sort((a,b)=>a.key-b.key).map(x=>x.item);
const gameQuestions=room=>seededOrder(poolFor(room),room.room_id||"quick").slice(0,room.subtype==="likely"?10:5);
const addHistory=(room,result)=>{if(state.history.some(item=>item.room_id===room.room_id))return;const points=room.type==="dinner"?10:15;state.history.unshift({room_id:room.room_id,id:result.items?.[0]?.id,title:room.type==="dinner"?"晚餐共同決定":"雙人遊戲完成",points,created_at:room.completed_at||new Date().toISOString()});saveHistory();ui.toast(`+${points} 默契點`);};
async function openRoom(room){state.room=room;if(room.status==="completed"){const result=makeResult(room);addHistory(room,result);return room.type==="dinner"?ui.renderDinnerResult(result):ui.renderGameResult(result,room.subtype)}if(room.answers?.[state.userId]){ui.renderWaiting(room);startPolling(room,state.userId,openRoom);return}if(room.type==="dinner")ui.dinnerForm(room);else ui.renderGameForm(room,gameQuestions(room))}
function makeResult(room){if(room.type==="dinner")return matchDinner(Object.values(room.answers),state.history.slice(0,3).map(x=>x.id));const questions=gameQuestions(room),answers=Object.values(room.answers),a=answers[0]||[],b=answers[1]||[];const details=questions.map((question,index)=>{const matched=room.subtype==="guess"&&question.type==="text"?scoreGuess(a[index]||"",b[index]||"",question.keywords):a[index]===b[index];return{text:question.text,a:a[index]||"未填寫",b:b[index]||"未填寫",matched}});const matched=details.filter(item=>item.matched).length,total=details.length||1;return{score:Math.round(matched/total*100),matched,total,details};}
const refreshCurrent=async()=>{const room=await api.getRoom(state.room.room_id,state.room.room_token,state.userId);room.room_token=state.room.room_token;return room};
const rememberLanyuDrafts=()=>{
  const bottle=document.querySelector("#lanyu-bottle-form textarea");
  if(bottle)state.lanyuBottleDraft=bottle.value;
  const custom=document.querySelector("#lanyu-custom-mission-form [name=mission_text]");
  if(custom)state.lanyuCustomDraft=custom.value;
};
const applyLanyuOverlays=data=>{
  const opened=state.lanyuOpenedBottles||{};
  const inbox=(data.inbox||[]).map(item=>opened[item.date]?{...item,...opened[item.date],opened:true}:item);
  let bottle=data.bottle||{};
  const today=data.date||taipeiDate();
  if(opened[today])bottle={...bottle,theirs:{...(bottle.theirs||{}),...opened[today],exists:true,opened:true}};
  return {...data,inbox,bottle,pendingMissionId:data.pendingMissionId??state.lanyuMissionId??null,bottleDraft:state.lanyuBottleDraft||"",customDraft:state.lanyuCustomDraft||""};
};
const showLanyu=(data,{scroll=false}={})=>{
  const {refreshing,error,...rest}=data;
  state.lanyuCache=rest;
  saveLanyuCache();
  ui.renderLanyu(applyLanyuOverlays(data));
  if(scroll)requestAnimationFrame(()=>document.querySelector("#lanyu-missions, #lanyu-bottle")?.scrollIntoView({block:"start"}));
};
const refreshLanyuView=async({force=false,refreshing=false}={})=>{
  if(!force&&document.activeElement?.closest?.("#lanyu-bottle-form, #lanyu-custom-mission-form"))return;
  rememberLanyuDrafts();
  const next=await api.lanyuState(state.userId,taipeiDate());
  showLanyu({...next,refreshing:false},{scroll:force&&!refreshing});
};
async function openLanyuPage({force=false}={}){
  const shell=localLanyuShell(state.userId,state.lanyuCache);
  showLanyu({...shell,refreshing:true});
  try{
    await refreshLanyuView({force,refreshing:true});
  }catch(error){
    showLanyu({...shell,...(state.lanyuCache||{}),refreshing:false,error:error.message});
    ui.toast(error.message);
  }
  startLanyuPolling(()=>refreshLanyuView());
}
async function render(){
  try{
    stopPolling();
    stopLanyuPolling();
    const q=query();
    if(q.room&&q.token){
      if(!state.userId)return ui.renderIdentity();
      const room=await api.getRoom(q.room,q.token,state.userId);
      room.room_token=q.token;
      return openRoom(room);
    }
    if(!state.userId)return ui.renderIdentity();
    if(state.route==="lanyu")return openLanyuPage({force:true});
    if(state.route==="dinner")return ui.renderDinner();
    if(state.route==="activity")return ui.renderActivity();
    if(state.route==="exercise")return ui.renderExercise();
    if(state.route==="games")return ui.renderGames();
    if(state.route==="pending")return ui.renderPending(await api.pending(state.userId));
    if(state.route==="history")return ui.renderHistory(isConfigured()?await api.history(state.userId):state.history);
    if(state.route==="settings")return ui.renderSettings();
    ui.renderHome();
  }catch(e){
    state.route==="lanyu"?ui.renderLanyuError(e.message):ui.renderError(e.message);
  }
}
async function create(type){try{const room=await createRoom(type,type==="dinner"?"dinner":type,state.userId);state.room=room;await openRoom(room)}catch(e){ui.toast(e.message)}}
async function handleLanyuAction(kind,arg,el){
  if(kind==="lanyu-health"){const r=await api.lanyuHealth();return ui.toast(r.LanyuMissions&&r.LanyuBottles?"蘭嶼資料表正常":"蘭嶼資料表尚未初始化")}
  if(kind==="lanyu-retry"||kind==="lanyu-refresh")return openLanyuPage({force:true});
  if(kind==="lanyu-pick"){
    rememberLanyuDrafts();
    state.lanyuMissionId=arg||null;
    return showLanyu(state.lanyuCache||localLanyuShell(state.userId));
  }
  if(kind==="lanyu-confirm"){
    const next=await api.lanyuAssign({user_id:state.userId,date:taipeiDate(),mission_id:arg});
    state.lanyuMissionId=null;
    return showLanyu(next);
  }
  if(kind==="lanyu-complete"){
    const next=await api.lanyuComplete({user_id:state.userId,date:taipeiDate()});
    return showLanyu(next);
  }
  if(kind==="lanyu-open"){
    const date=normalizeLanyuDate(el.dataset.date||arg)||taipeiDate();
    const openedState=await api.lanyuOpenBottle({user_id:state.userId,date});
    const theirs=openedState.bottle?.theirs;
    const openedBottle=(openedState.inbox||[]).find(item=>item.date===date&&item.opened&&item.message!=null)
      ||(theirs?.opened&&theirs.message!=null&&(!theirs.date||theirs.date===date)?theirs:null);
    rememberLanyuDrafts();
    if(!openedBottle){
      ui.toast("漂流瓶還沒打開成功，請再試一次或稍後更新連線");
      return showLanyu(openedState);
    }
    state.lanyuOpenedBottles={...state.lanyuOpenedBottles,[date]:{...openedBottle,opened:true,date}};
    return showLanyu(openedState);
  }
}
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-action],[data-route],[data-chip],[data-condition],[data-question]");
  if(!el)return;
  if(el.dataset.route)return go(el.dataset.route);
  if(el.dataset.chip||el.dataset.condition)return el.classList.toggle("selected");
  if(el.dataset.question){
    const input=document.querySelector(`[name="${el.dataset.question}"]`);
    input.value=el.dataset.value;
    el.parentElement.querySelectorAll(".choice").forEach(x=>x.classList.remove("selected"));
    el.classList.add("selected");
    return;
  }
  const {kind,arg}=parseAction(el.dataset.action||"");
  try{
    if(kind==="identity"){setUser(arg);state.userId=arg;return render()}
    if(kind==="route")return go(arg);
    if(kind==="new-room")return create(arg);
    if(kind==="quick-dinner"){state.room=null;return ui.dinnerForm(null)}
    if(kind.startsWith("lanyu-"))return handleLanyuAction(kind,arg,el);
    if(kind==="share-room"){const r=await shareRoom(state.room);return ui.toast(r.copied?"已複製，可以貼到 LINE":"已開啟分享")}
    if(kind==="refresh-room")return openRoom(await refreshCurrent());
    if(kind==="cancel-room"){await api.cancel({room_id:state.room.room_id,room_token:state.room.room_token,user_id:state.userId});history.replaceState({},"",location.pathname);return go("pending")}
    if(kind==="health"){const r=await api.health();return ui.toast(`連線正常：${r.mode||"Apps Script"}`)}
    if(kind==="change-identity"||kind==="clear-identity"){storage.remove("user");state.userId=null;return render()}
    if(kind==="avoid"){setTemporaryAvoid(arg);return ui.toast("這個選項七天內不會再優先推薦")}
    if(kind==="accept-dinner")return ui.toast("就決定這個，出發前記得確認營業時間！");
    if(kind==="more-dinner"){const answers=state.room?.answers?Object.values(state.room.answers):[state.lastDinner||{}];const result=matchDinner(answers,[...state.history.map(item=>item.id),...(state.lastDinnerResult?.items||[]).map(item=>item.id)]);state.lastDinnerResult=result;return ui.renderDinnerResult(result)}
  }catch(err){ui.toast(err.message)}
});
document.addEventListener("submit",async e=>{
  e.preventDefault();
  try{
    if(e.target.id==="lanyu-bottle-form"){
      const message=new FormData(e.target).get("message");
      state.lanyuBottleDraft="";
      const next=await api.lanyuSendBottle({user_id:state.userId,date:taipeiDate(),message});
      return showLanyu(next);
    }
    if(e.target.id==="lanyu-custom-mission-form"){
      const mission_text=validateCustomMission(new FormData(e.target).get("mission_text"));
      const next=await api.lanyuAssign({user_id:state.userId,date:taipeiDate(),mission_id:LANYU_CUSTOM_MISSION_ID,mission_text});
      state.lanyuMissionId=null;
      state.lanyuCustomDraft="";
      return showLanyu(next);
    }
    if(e.target.id==="dinner-form"){
      const form=e.target,data=Object.fromEntries(new FormData(form));
      data.foodTypes=[...form.querySelectorAll("[data-chip].selected")].map(x=>x.dataset.chip);
      data.conditions=[...form.querySelectorAll("[data-condition].selected")].map(x=>x.dataset.condition);
      state.lastDinner=data;
      if(!state.room){const result=matchDinner([data]);state.lastDinnerResult=result;return ui.renderDinnerResult(result,"今晚快速推薦")}
      await submit(state.room,state.userId,data);
      return openRoom(await refreshCurrent());
    }
    if(e.target.id==="activity-form")return ui.renderActivity(recommendActivities(Object.fromEntries(new FormData(e.target))));
    if(e.target.id==="exercise-form")return ui.renderExercise(recommendExercises(Object.fromEntries(new FormData(e.target))));
    if(e.target.id==="game-form"){
      const data=Object.fromEntries(new FormData(e.target)),answers=gameQuestions(state.room).map(q=>data[q.id]);
      await submit(state.room,state.userId,answers);
      return openRoom(await refreshCurrent());
    }
  }catch(err){ui.toast(err.message)}
});
document.querySelector("#theme-toggle").addEventListener("click",()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==="dark"?"light":"dark"});
window.addEventListener("route",render);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.route==="lanyu")openLanyuPage();});
render();
