import {state} from "./state.js";
export function go(route,params={}){state.route=route;history.pushState({}, "",`${location.pathname}${params.query||""}`);window.dispatchEvent(new CustomEvent("route"))}
export const query=()=>Object.fromEntries(new URLSearchParams(location.search));
window.addEventListener("popstate",()=>window.dispatchEvent(new CustomEvent("route")));
