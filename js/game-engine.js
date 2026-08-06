import {normalize} from "./utils.js";
export function scoreCompatibility(answers){const users=Object.keys(answers);if(users.length<2)return null;const a=answers[users[0]],b=answers[users[1]];const matched=a.reduce((n,x,i)=>n+(x===b[i]?1:0),0);return{score:Math.round(matched/a.length*100),matched,total:a.length}}
export function scoreGuess(answer,guess,keywords=[]){const a=normalize(answer),g=normalize(guess);return a===g||keywords.some(k=>a.includes(normalize(k))&&g.includes(normalize(k)))||a.includes(g)||g.includes(a)}
export function scoreLabel(score){if(score===100)return"完美情人！根本是靈魂伴侶！";if(score>=90)return"優秀寶貝！只有少數小細節要加強。";if(score>=80)return"合格戀人，大部分都記得，很棒喔！";if(score>=70)return"還不錯啦，但要多關心彼此的小事。";if(score>=60)return"及格邊緣，是不是最近太忙了？";return"今晚罰你多抱抱對方十秒。"}
