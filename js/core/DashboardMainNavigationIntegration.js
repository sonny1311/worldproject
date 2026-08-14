// WorldProject – die vorhandene Hauptnavigation sitzt auf der dunklen Wirtschaftsstartseite
// direkt unter den Kennzahlen. Beim Schließen wird dieselbe DOM-Leiste zurück an ihren Ursprung gesetzt.
import { EconomyDashboard } from './EconomyDashboard.js';

const NAV_ID='world-main-nav';
const proto=EconomyDashboard.prototype;

function summaryGrid(panel){
  return [...(panel?.children||[])].find(el=>{
    if(el?.tagName!=='DIV')return false;
    const titles=[...el.querySelectorAll(':scope > div > div:first-child')].map(x=>x.textContent?.trim());
    return titles.includes('💶 Firmenkonto')&&titles.includes('🏬 Lager');
  })||null;
}
function dockNavigation(panel){
  const nav=document.getElementById(NAV_ID),summary=summaryGrid(panel);
  if(!nav||!summary)return false;
  if(!nav.dataset.worldDocked){
    nav.dataset.worldDocked='1';
    nav.dataset.worldHome='body';
  }
  summary.insertAdjacentElement('afterend',nav);
  Object.assign(nav.style,{
    position:'static',left:'auto',right:'auto',bottom:'auto',zIndex:'1',
    display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px',
    maxWidth:'100%',width:'100%',margin:'0 0 18px',padding:'0',pointerEvents:'auto'
  });
  return true;
}
function undockNavigation(){
  const nav=document.getElementById(NAV_ID);if(!nav||!nav.dataset.worldDocked)return false;
  document.body.append(nav);
  Object.assign(nav.style,{
    position:'fixed',left:'18px',right:'18px',bottom:'18px',zIndex:'11000',
    display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px',
    maxWidth:'calc(100vw - 36px)',width:'auto',margin:'0',padding:'0',pointerEvents:'none'
  });
  return true;
}

if(!proto.__worldMainNavigationDocked){
  proto.__worldMainNavigationDocked=true;
  const originalRender=proto.render;
  proto.render=function(panel,...args){
    const result=originalRender.call(this,panel,...args);
    dockNavigation(panel);
    requestAnimationFrame(()=>dockNavigation(panel));
    return result;
  };
  const originalClose=proto.close;
  proto.close=function(...args){undockNavigation();return originalClose.call(this,...args);};
}

export function runDashboardMainNavigationIntegrationTest(){return typeof dockNavigation==='function'&&typeof undockNavigation==='function';}
