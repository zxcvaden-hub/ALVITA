import {CONFIG} from "../config/config.js";import {getUser,storage} from "./storage.js";
export const state={userId:getUser(),route:"home",room:null,history:storage.get("mock-history",[]),settings:storage.get("settings",{theme:"system"}),loading:false,lanyuCache:storage.get("lanyu-cache",null),lanyuMissionId:null,lanyuBottleDraft:"",lanyuCustomDraft:"",lanyuOpenedBottles:{}};
export const isConfigured=()=>/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(CONFIG.API_URL);
export const saveHistory=()=>storage.set("mock-history",state.history);
export const saveLanyuCache=()=>storage.set("lanyu-cache",state.lanyuCache);
