// ORVUNO – Schließen-Kopfzeile in „Meine Betriebe“ beim Scrollen sichtbar halten.
import { BusinessPortfolioDialog } from './BusinessPortfolioDialog.js';

const proto=BusinessPortfolioDialog.prototype;
if(!proto.__orvunoStickyCloseIntegrated){
 proto.__orvunoStickyCloseIntegrated=true;
 const originalOpen=proto.open;
 proto.open=async function(...args){
  const result=await originalOpen.apply(this,args);
  const overlay=this.overlay;
  const panel=overlay?.firstElementChild;
  const head=panel?.firstElementChild;
  if(overlay)overlay.dataset.orvunoBusinessPortfolio='1';
  if(panel)panel.dataset.orvunoBusinessPortfolioPanel='1';
  if(head){
   head.dataset.orvunoStickyDialogHead='1';
   Object.assign(head.style,{
    position:'sticky',
    top:'-22px',
    zIndex:'20',
    margin:'-22px -22px 10px',
    padding:'18px 22px 12px',
    background:'#0f1b2d',
    borderBottom:'1px solid #334155',
    boxShadow:'0 8px 18px rgba(0,0,0,.28)'
   });
   const title=head.querySelector('h2');
   if(title)Object.assign(title.style,{margin:'0',color:'#f8fafc'});
   const close=[...head.querySelectorAll('button')].find(b=>(b.textContent||'').includes('✕'));
   if(close)Object.assign(close.style,{position:'relative',zIndex:'21',fontSize:'22px',minWidth:'44px',minHeight:'44px'});
  }
  return result;
 };
}
