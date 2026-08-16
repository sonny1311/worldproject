// ORVUNO – Hilfe und Rechtliches gehoeren in den Footer, nicht in die Hauptnavigation.
function removeTopLinks(){
  document.getElementById('world-help-button')?.remove();
  document.getElementById('world-legal-button')?.remove();
}
function open(section){
  const hub=window.worldPlayerInfoHub;
  if(!hub?.open)return;
  hub.open(section);
}
function mountFooter(){
  removeTopLinks();
  let footer=document.getElementById('orvuno-footer');
  if(footer)return footer;
  footer=document.createElement('footer');footer.id='orvuno-footer';
  Object.assign(footer.style,{position:'fixed',left:'0',right:'0',bottom:'0',zIndex:'9000',display:'flex',justifyContent:'center',alignItems:'center',gap:'18px',flexWrap:'wrap',padding:'7px 16px',background:'rgba(5,11,20,.94)',borderTop:'1px solid #1d2b40',fontFamily:'Arial,sans-serif',fontSize:'12px',color:'#8291a6'});
  const items=[['Hilfe','help'],['Impressum','legal'],['Datenschutz','legal'],['AGB','legal']];
  for(const [label,section] of items){
    const a=document.createElement('button');a.type='button';a.textContent=label;a.dataset.footerLink=label;
    Object.assign(a.style,{border:'0',background:'transparent',color:'#9eacc0',padding:'2px 4px',cursor:'pointer',fontSize:'12px',textDecoration:'none'});
    a.onmouseenter=()=>a.style.color='#fff';a.onmouseleave=()=>a.style.color='#9eacc0';
    a.onclick=()=>open(section);footer.append(a);
  }
  document.body.append(footer);return footer;
}
function install(){
  mountFooter();
  // Der Info-Hub kann spaeter mounten und seine alten Buttons erneut anlegen.
  // Deshalb entfernen wir genau diese beiden Links auch nach UI-Aenderungen.
  new MutationObserver(()=>removeTopLinks()).observe(document.documentElement,{childList:true,subtree:true});
}
if(typeof window!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}
export {mountFooter,removeTopLinks};
