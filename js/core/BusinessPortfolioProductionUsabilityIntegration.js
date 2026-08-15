// WorldProject – macht den Gewerbekatalog im Dark-UI lesbar und stellt direkten Produktionszugang wieder her.
import './BusinessPortfolioStickyCloseIntegration.js';
import { BusinessPortfolioDialog } from './BusinessPortfolioDialog.js';
import { OperationalSupplyChainDialog } from './OperationalSupplyChainDialog.js';
import { applyFocus } from './OperationalDialogSectionPersistenceIntegration.js';

const proto=BusinessPortfolioDialog.prototype;

function important(el,prop,value){el?.style?.setProperty?.(prop,value,'important');}
function styleCatalog(panel){
 if(!panel?.querySelectorAll)return false;
 const title=[...panel.querySelectorAll('div')].find(x=>String(x.textContent||'').trim().startsWith('Gewerbekatalog ·'));
 const wrap=title?.parentElement;if(!wrap)return false;
 important(wrap,'background','#111827');important(wrap,'color','#f8fafc');important(wrap,'border-color','#334155');
 const search=wrap.querySelector('input');if(search){important(search,'background','#0f172a');important(search,'color','#f8fafc');important(search,'border-color','#475569');}
 const buttons=[...wrap.querySelectorAll('button')];
 for(const b of buttons){
  const strong=b.querySelector(':scope > strong'),children=[...b.children];
  if(strong&&children.length>=3){
   const selected=String(b.style.border||'').includes('2px');
   important(b,'background',selected?'#1e3a5f':'#1f2937');important(b,'color','#f8fafc');important(b,'border-color',selected?'#60a5fa':'#475569');important(b,'box-shadow',selected?'0 0 0 1px #60a5fa':'none');
   strong.textContent=`🏭 ${String(strong.textContent||'').replace(/^🏭\s*/,'')}`;important(strong,'color','#ffffff');important(strong,'font-size','16px');important(strong,'display','block');
   for(const child of children.slice(1)){important(child,'color','#dbeafe');important(child,'opacity','1');}
  }else{
   important(b,'background','#243247');important(b,'color','#f8fafc');important(b,'border','1px solid #475569');
  }
 }
 const detail=[...wrap.children].find(x=>x!==title&&x!==search&&String(x.textContent||'').includes('Ausgewählt:'));
 if(detail){important(detail,'background','#172554');important(detail,'color','#eff6ff');important(detail,'border','1px solid #3b82f6');}
 return true;
}

async function openOperationalSection(owner,section='production'){
 const company=window.worldPlayerCompany||owner?.portfolio?.activeCompany;
 if(!company)throw new Error('Kein aktiver Betrieb vorhanden');
 let dialog=window.worldOperationalSupplyChainDialog;
 if(!dialog){dialog=new OperationalSupplyChainDialog({companyProvider:()=>window.worldPlayerCompany||owner?.portfolio?.activeCompany||null,parent:document.body});window.worldOperationalSupplyChainDialog=dialog;}
 if(dialog.overlay)dialog.close();
 dialog.loadedCompanyId=null;dialog.__worldFocusedSection=section;
 owner?.close?.();
 await dialog.open();
 applyFocus(dialog,section);
 requestAnimationFrame(()=>applyFocus(dialog,section));
 return true;
}

function addActiveBusinessActions(dialog,panel){
 if(!panel?.querySelectorAll)return false;
 const activeButton=[...panel.querySelectorAll('button')].find(b=>String(b.textContent||'').trim()==='Aktiver Betrieb');
 const card=activeButton?.parentElement;if(!card)return false;
 activeButton.textContent='✅ Aktiver Betrieb';activeButton.disabled=true;
 if(card.querySelector('[data-world-active-business-actions]'))return true;
 const actions=document.createElement('div');actions.dataset.worldActiveBusinessActions='1';Object.assign(actions.style,{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'9px'});
 const production=dialog.button('🏭 Produktion öffnen',()=>openOperationalSection(dialog,'production').catch(e=>alert(e.message)));
 const supply=dialog.button('📦 Einkauf & Lager',()=>openOperationalSection(dialog,'buy').catch(e=>alert(e.message)));
 Object.assign(production.style,{background:'#166534',color:'#fff',border:'1px solid #22c55e'});Object.assign(supply.style,{background:'#1e3a8a',color:'#fff',border:'1px solid #60a5fa'});
 actions.append(production,supply);card.append(actions);return true;
}

function installTopProductionButton(){
 const nav=document.getElementById('world-main-nav');if(!nav||nav.querySelector('#world-production-button'))return false;
 const b=document.createElement('button');b.id='world-production-button';b.type='button';b.textContent='🏭 Produktion';b.title='Produktion des aktiven Betriebs öffnen';b.onclick=()=>openOperationalSection(null,'production').catch(e=>alert(e.message));
 Object.assign(b.style,{background:'#1e293b',color:'#f8fafc',border:'1px solid #475569',borderRadius:'9px',padding:'9px 12px',fontWeight:'800',cursor:'pointer'});nav.append(b);return true;
}

if(!proto.__worldBusinessPortfolioProductionUsability){
 proto.__worldBusinessPortfolioProductionUsability=true;
 const originalRender=proto.render;
 proto.render=async function(panel,...args){
  const result=await originalRender.call(this,panel,...args);
  styleCatalog(panel);addActiveBusinessActions(this,panel);
  requestAnimationFrame(()=>{styleCatalog(panel);addActiveBusinessActions(this,panel);});
  return result;
 };
}

export function installBusinessPortfolioProductionUsability(){
 if(typeof document==='undefined')return false;
 const apply=()=>installTopProductionButton();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
 const observer=new MutationObserver(apply);observer.observe(document.documentElement,{childList:true,subtree:true});
 for(const ev of ['world:access-granted','worldproject:company-loaded','worldproject:company-switched'])window.addEventListener(ev,()=>setTimeout(apply,0));
 return true;
}
export function runBusinessPortfolioProductionUsabilityTest(){return proto.__worldBusinessPortfolioProductionUsability===true&&typeof openOperationalSection==='function';}
if(typeof window!=='undefined'){window.worldBusinessPortfolioProductionUsability={install:installBusinessPortfolioProductionUsability,test:runBusinessPortfolioProductionUsabilityTest};installBusinessPortfolioProductionUsability();}
