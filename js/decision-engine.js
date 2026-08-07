import {FOOD_OPTIONS} from "../data/food-options.js";
import {ACTIVITY_OPTIONS} from "../data/activity-options.js";
import {EXERCISE_OPTIONS} from "../data/exercise-options.js";
import {getTemporaryAvoid} from "./storage.js";
import {clamp} from "./utils.js";
const budget=value=>Number(value)||9999;
const conditions=answer=>answer.conditions||[];
const has=(all,text)=>all.includes(text);
const isAvoided=(id,avoids)=>Boolean(avoids[id]);
const rankedSort=(a,b)=>b.score-a.score||a.title.localeCompare(b.title,"zh-Hant");

export function matchDinner(answers,recent=[]){
 const a=answers[0]||{},b=answers[1]||a,types=a.foodTypes||[],typesB=b.foodTypes||types;
 const shared=types.filter(type=>typesB.includes(type)),allConditions=[...conditions(a),...conditions(b)];
 const maxBudget=Math.min(budget(a.budget),budget(b.budget)),strict=[a.mood,b.mood].includes("認真減脂");
 const lowAppetite=[a.mood,b.mood].includes("沒什麼胃口"),hungry=[a.mood,b.mood].includes("肚子快餓扁");
 const avoids=getTemporaryAvoid();
 const ranked=FOOD_OPTIONS.map(food=>{
  let score=20;
  const sharedHits=food.foodType.filter(type=>shared.includes(type)).length;
  const selectedHits=food.foodType.filter(type=>[...types,...typesB].includes(type)).length;
  score+=sharedHits*38+selectedHits*6;
  if(food.budget<=maxBudget)score+=16;else score-=45;
  if(strict)score+=(4-food.caloriesLevel)*10;
  if(has(allConditions,"只想吃附近"))score+=food.distance<=10?14:-16;
  if(has(allConditions,"不想排隊"))score+=(3-food.waitingRisk)*7;
  if(has(allConditions,"想吃熱的")&&food.moodTags.includes("熱"))score+=9;
  if(has(allConditions,"想吃清淡")&&food.moodTags.includes("清淡"))score+=9;
  if(has(allConditions,"想吃肉")&&food.moodTags.includes("肉"))score+=7;
  if(has(allConditions,"想吃蔬菜")&&food.moodTags.includes("蔬菜"))score+=7;
  if(has(allConditions,"家裡有剩菜")&&food.id==="cook")score+=14;
  if(has(allConditions,"今天不想洗碗")&&food.preparation==="自己煮")score-=18;
  if(has(allConditions,"晚餐後還要運動")&&food.caloriesLevel<=2)score+=8;
  if(lowAppetite&&food.caloriesLevel<=2)score+=8;
  if(hungry&&food.timeRequired<=30)score+=9;
  if(recent.includes(food.id))score-=18;
  if(isAvoided(food.id,avoids))score-=70;
  return {...food,score:clamp(score,0,100)};
 }).sort(rankedSort);
 const items=ranked.slice(0,3),primary=items[0];
 const reasons=[];
 if(shared.length)reasons.push(`你們都選了${shared.slice(0,2).join("、")}。`);
 else reasons.push("沒有重疊菜系，先以好找、好吃、能一起接受為主。");
 if(primary?.budget<=maxBudget)reasons.push(`每人約 ${primary.budget} 元，落在這次預算內。`);
 if(strict&&primary?.caloriesLevel<=2)reasons.push("今天有減脂條件，優先排除太負擔的選項。");
 if(has(allConditions,"只想吃附近")&&primary?.distance<=10)reasons.push("符合想就近解決的條件。");
 if(has(allConditions,"不想排隊")&&primary?.waitingRisk<=1)reasons.push("等待風險比較低，不容易越等越餓。");
 return {score:Math.round(items.reduce((sum,item)=>sum+item.score,0)/Math.max(items.length,1)),items,alternatives:ranked.slice(3,6),shared,reasons,tip:strict?"主食可以分著吃，先把蛋白質和蔬菜點好。":hungry?"先點一份能快上桌的，再慢慢補想吃的。":"第一名先查一下距離與營業時間，能出發就別再滑菜單。",compromise:shared.length?"":"今天口味不同也沒關係：先選附近、熱的、30 分鐘內能吃到的店。"};
}

export function recommendActivities(filter={}){
 const avoids=getTemporaryAvoid(),duration=Number(filter.duration)||120,limit=Number(filter.budget)||0;
 return ACTIVITY_OPTIONS.map(item=>{
  let score=20;
  if(!filter.location||filter.location==="都可以"||item.location===filter.location)score+=25;else score-=20;
  if(item.minDuration<=duration)score+=18;else score-=35;
  if(item.budget<=limit)score+=16;else score-=35;
  if(!filter.energy||filter.energy==="都可以"||item.energy===filter.energy)score+=12;
  if(!filter.desire||filter.desire==="都可以"||item.desire===filter.desire)score+=18;
  if(isAvoided(item.id,avoids))score-=70;
  return {...item,score};
 }).filter(item=>item.score>0).sort(rankedSort).slice(0,3);
}

export function recommendExercises(filter={}){
 const avoids=getTemporaryAvoid(),duration=Number(filter.duration)||60;
 return EXERCISE_OPTIONS.map(item=>{
  let score=20;
  if(!filter.location||filter.location==="都可以"||item.location===filter.location)score+=25;else score-=22;
  if(item.duration<=duration)score+=18;else score-=35;
  if(!filter.energy||filter.energy==="都可以"||item.energy===filter.energy)score+=15;
  if(!filter.goal||filter.goal==="都可以"||item.goal===filter.goal)score+=18;
  if(isAvoided(item.id,avoids))score-=70;
  return {...item,score};
 }).filter(item=>item.score>0).sort(rankedSort).slice(0,3);
}
