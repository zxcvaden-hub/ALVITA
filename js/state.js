import {CONFIG} from "../config/config.js";import {getUser,storage} from "./storage.js";
export const state={userId:getUser(),route:"home",room:null,history:storage.get("mock-history",[]),settings:storage.get("settings",{theme:"system"}),loading:false,lanyuMissionId:null,lanyuBottleDraft:"",lanyuCustomMissionDraft:"",lanyuOpenedBottles:{},lanyuBusy:false,lanyuLastSync:null,lanyuConnection:"idle"};
export const isConfigured=()=>/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(CONFIG.API_URL);
export const saveHistory=()=>storage.set("mock-history",state.history);
