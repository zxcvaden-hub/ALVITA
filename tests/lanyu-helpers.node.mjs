import {countChars,localLanyuShell,normalizeLanyuDate,parseAction,taipeiDate,validateCustomMission} from "../js/lanyu.js";
import {LANYU_CUSTOM_MISSION_ID,getLanyuDay} from "../data/lanyu-missions.js";

const assert=(condition,message)=>{if(!condition)throw new Error(message);};

assert(parseAction("lanyu-open:2026-09-04").kind==="lanyu-open","kind keeps first token");
assert(parseAction("lanyu-open:2026-09-04").arg==="2026-09-04","arg keeps the rest after first colon");
assert(parseAction("lanyu-open:2026-09-04T00:00:00.000Z").arg==="2026-09-04T00:00:00.000Z","ISO dates are not truncated");
assert(normalizeLanyuDate("2026-09-04T00:00:00.000Z")==="2026-09-04","normalize extracts YYYY-MM-DD");
assert(normalizeLanyuDate("lanyu-open:undefined")==="","invalid dates become empty");
assert(countChars("出水後先傳訊息給我")===9,"count Chinese characters");
validateCustomMission("出水後先傳訊息給我");
try{validateCustomMission("x".repeat(31));throw new Error("should reject 31 chars");}catch(error){assert(error.message.includes("30"),error.message)}
assert(getLanyuDay(taipeiDate())||true,"local day lookup does not throw");
const shell=localLanyuShell("chien",null);
assert(shell.day.missions.length===3||shell.date<"2026-09-03"||shell.date>"2026-09-11","shell has today missions inside the trip");
assert(LANYU_CUSTOM_MISSION_ID==="custom","custom mission id stays stable");
console.log("lanyu helpers ok");
