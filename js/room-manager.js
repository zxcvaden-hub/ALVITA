import {api} from "./api.js";import {uid,token,now} from "./utils.js";import {partnerOf} from "../data/couple-profile.js";import {CONFIG} from "../config/config.js";
let poller;
export async function createRoom(type,subtype,userId){const room={room_id:uid(),room_token:token(),type,subtype,creator_user_id:userId,partner_user_id:partnerOf(userId),status:"waiting",created_at:now(),expires_at:new Date(Date.now()+CONFIG.ROOM_EXPIRE_HOURS*36e5).toISOString(),answers:{}};return api.createRoom(room)}
export const roomUrl=r=>`${location.origin}${location.pathname}?room=${encodeURIComponent(r.room_id)}&token=${encodeURIComponent(r.room_token)}`;
export async function submit(room,userId,payload,result){return api.submitAnswer({room_id:room.room_id,room_token:room.room_token,user_id:userId,payload,result})}
export function startPolling(room,user,callback){stopPolling();const refresh=async()=>{if(document.hidden)return;try{const latest=await api.getRoom(room.room_id,room.room_token,user);latest.room_token=room.room_token;callback(latest)}catch(e){console.error(e)}};poller=setInterval(refresh,CONFIG.POLLING_INTERVAL);document.addEventListener("visibilitychange",refresh,{once:true});return refresh}
export function stopPolling(){if(poller)clearInterval(poller);poller=null}
