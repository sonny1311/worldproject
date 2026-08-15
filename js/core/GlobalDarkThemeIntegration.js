// ORVUNO – zentrale dunkle Theme-Schicht fuer Spieleroberflaechen.
const STYLE_ID='world-global-dark-theme';
const css=`
:root{color-scheme:dark;--wp-bg:#0f172a;--wp-panel:#111827;--wp-panel2:#1e293b;--wp-border:#334155;--wp-text:#f8fafc;--wp-muted:#cbd5e1;--wp-accent:#3b82f6;--wp-good:#166534;--wp-warn:#92400e;--wp-bad:#991b1b}
html,body{background:#0b1120!important;color:var(--wp-text)!important}
body>div{color:var(--wp-text)}
.world-dialog,.world-modal,.world-panel,[data-world-active-operations-overlay]>section,[data-premium-extra-packages],#world-main-nav{color:var(--wp-text)!important}
section,article,.world-card,.world-machine-purchase-section{border-color:var(--wp-border)!important}
button,input,select,textarea{font:inherit}
button{background:#1e293b;color:#f8fafc;border:1px solid #475569}
button:hover:not(:disabled){background:#334155}
button:disabled{opacity:.5;cursor:not-allowed}
input,select,textarea{background:#0f172a!important;color:#f8fafc!important;border:1px solid #475569!important;border-radius:7px}
option{background:#111827;color:#f8fafc}
table{color:#f8fafc;border-color:#334155}th{background:#1e293b!important;color:#f8fafc!important}td{border-color:#334155!important}
hr{border-color:#334155}a{color:#93c5fd}
[style*="background:#fff"],[style*="background: #fff"],[style*="background:white"],[style*="background: white"],[style*="background:#fafafa"],[style*="background: #fafafa"],[style*="background:#f5f5f5"],[style*="background: #f5f5f5"],[style*="background:#eef3f8"],[style*="background: #eef3f8"],[style*="background: rgb(255, 255, 255)"],[style*="background: rgb(250, 250, 250)"],[style*="background: rgb(248, 250, 252)"],[style*="background: rgb(245, 245, 245)"]{background:#111827!important;color:#f8fafc!important}
[style*="color:#111"],[style*="color: #111"],[style*="color: rgb(17, 24, 39)"],[style*="color: rgb(17, 17, 17)"]{color:#f8fafc!important}
[style*="border:1px solid #ddd"],[style*="border: 1px solid #ddd"],[style*="border:1px solid #bbb"],[style*="border: 1px solid #bbb"]{border-color:#475569!important}
.world-operational-tabbar{background:#111827!important;border-color:#334155!important}
.world-operational-tabbar button{background:#1e293b!important;color:#f8fafc!important}
[data-world-active-operations-overlay]{background:rgba(2,6,23,.82)!important}
[data-world-active-operations-overlay]>section{background:linear-gradient(180deg,#111827,#0b1220)!important;color:#f8fafc!important;border:1px solid #334155!important;scrollbar-color:#475569 #0f172a}
[data-world-active-operations-overlay]>section>div:first-child{background:#111827!important;color:#f8fafc!important;border-bottom:1px solid #263449!important}
[data-world-active-operations-overlay] [data-operation-kind]{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important}
[data-world-active-operations-overlay] [data-operation-filter]{background:#172033!important;color:#e5edf8!important;border-color:#3b4d68!important;min-height:48px}
[data-world-active-operations-overlay] [data-operation-filter][aria-pressed="true"]{background:#26354d!important;color:#fff!important;outline:2px solid #8b5cf6!important;outline-offset:-2px}
[data-world-active-operations-overlay] [style*="background: rgb(255, 247, 237)"],[data-world-active-operations-overlay] [style*="background: rgb(255, 251, 235)"]{background:#2a1d0d!important;color:#fde68a!important;border-color:#a16207!important}
[data-world-active-operations-overlay] [style*="background: rgb(240, 253, 244)"]{background:#10261a!important;color:#bbf7d0!important;border-color:#166534!important}
[data-world-active-operations-overlay] [style*="border-top: 1px solid rgb(229, 231, 235)"],[data-world-active-operations-overlay] [style*="border-top:1px solid #e5e7eb"]{border-top-color:#334155!important}
[data-world-active-operations-overlay] button{background:#1e293b!important;color:#f8fafc!important;border-color:#475569!important}
[data-world-active-operations-overlay] button:hover:not(:disabled){background:#334155!important;border-color:#64748b!important}
[data-world-active-operations-overlay] select{background:#0f172a!important;color:#f8fafc!important;border-color:#475569!important}
[data-premium-extra-packages] article{background:#111827!important;color:#f8fafc!important}
.world-dark-surface{background:#111827!important;color:#f8fafc!important;border-color:#334155!important}
.world-assignment-status{box-shadow:none!important}
`;
const LIGHT_BACKGROUNDS=new Set([
 'rgb(255, 255, 255)','rgb(250, 250, 250)','rgb(245, 245, 245)','rgb(248, 249, 250)','rgb(248, 250, 252)','rgb(238, 243, 248)','rgb(238, 245, 255)','rgb(234, 242, 255)'
]);
function installStyle(){if(typeof document==='undefined')return false;let style=document.getElementById(STYLE_ID);if(style)return true;style=document.createElement('style');style.id=STYLE_ID;style.textContent=css;document.head.append(style);document.documentElement.dataset.worldTheme='dark';return true;}
function darkenDynamic(root=document){const nodes=[];if(root?.matches?.('div,section,article,aside,main'))nodes.push(root);for(const el of root.querySelectorAll?.('div,section,article,aside,main')||[])nodes.push(el);for(const el of nodes){const s=getComputedStyle(el),bg=s.backgroundColor;if(LIGHT_BACKGROUNDS.has(bg))el.classList.add('world-dark-surface');}}
export function installGlobalDarkTheme(){if(typeof document==='undefined')return false;installStyle();const apply=()=>darkenDynamic(document);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();const observer=new MutationObserver(rows=>{for(const row of rows)for(const node of row.addedNodes)if(node.nodeType===1)darkenDynamic(node);});observer.observe(document.documentElement,{childList:true,subtree:true});return true;}
export function runGlobalDarkThemeTest(){return css.includes('--wp-bg')&&css.includes('data-operation-filter')&&LIGHT_BACKGROUNDS.has('rgb(248, 250, 252)');}
if(typeof window!=='undefined'){window.worldGlobalDarkTheme={install:installGlobalDarkTheme,runTest:runGlobalDarkThemeTest};installGlobalDarkTheme();}
