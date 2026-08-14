// WorldProject – zentrale dunkle Theme-Schicht fuer Spieleroberflaechen.
const STYLE_ID='world-global-dark-theme';
const css=`
:root{color-scheme:dark;--wp-bg:#0f172a;--wp-panel:#111827;--wp-panel2:#1e293b;--wp-border:#334155;--wp-text:#f8fafc;--wp-muted:#cbd5e1;--wp-accent:#3b82f6;--wp-good:#166534;--wp-warn:#92400e;--wp-bad:#991b1b}
html,body{background:#0b1120!important;color:var(--wp-text)!important}
body>div:not([data-world-auth-overlay]):not([data-world-company-setup-overlay]){color:var(--wp-text)}
.world-dialog,.world-modal,.world-panel,[data-world-active-operations-overlay]>section,[data-premium-extra-packages],#world-main-nav{color:var(--wp-text)!important}
section,article,.world-card,.world-machine-purchase-section{border-color:var(--wp-border)!important}
button,input,select,textarea{font:inherit}
button{background:#1e293b;color:#f8fafc;border:1px solid #475569}
button:hover:not(:disabled){background:#334155}
button:disabled{opacity:.5;cursor:not-allowed}
input,select,textarea{background:#0f172a!important;color:#f8fafc!important;border:1px solid #475569!important;border-radius:7px}
option{background:#111827;color:#f8fafc}
table{color:#f8fafc;border-color:#334155}th{background:#1e293b!important;color:#f8fafc!important}td{border-color:#334155!important}
hr{border-color:#334155}
a{color:#93c5fd}
.world-operational-tabbar{background:#111827!important;border-color:#334155!important}
.world-operational-tabbar button{background:#1e293b!important;color:#f8fafc!important}
[data-world-active-operations-overlay]{background:rgba(2,6,23,.78)!important}
[data-world-active-operations-overlay]>section{background:#111827!important;color:#f8fafc!important}
[data-world-active-operations-overlay] [style*="background: rgb(255"],
[data-world-active-operations-overlay] [style*="background:#fff"],
[data-world-active-operations-overlay] [style*="background: #fff"]{background:#1e293b!important;color:#f8fafc!important}
[data-premium-extra-packages] article{background:#111827!important;color:#f8fafc!important}
.world-dark-surface{background:#111827!important;color:#f8fafc!important;border-color:#334155!important}
`;
function installStyle(){if(typeof document==='undefined')return false;let style=document.getElementById(STYLE_ID);if(style)return true;style=document.createElement('style');style.id=STYLE_ID;style.textContent=css;document.head.append(style);document.documentElement.dataset.worldTheme='dark';return true;}
function darkenDynamic(root=document){for(const el of root.querySelectorAll?.('div,section,article,aside,main')||[]){const s=getComputedStyle(el),bg=s.backgroundColor;if(['rgb(255, 255, 255)','rgb(250, 250, 250)','rgb(248, 249, 250)','rgb(238, 243, 248)'].includes(bg)){el.classList.add('world-dark-surface');}}}
export function installGlobalDarkTheme(){if(typeof document==='undefined')return false;installStyle();const apply=()=>darkenDynamic(document);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();const observer=new MutationObserver(rows=>{for(const row of rows)for(const node of row.addedNodes)if(node.nodeType===1){if(node.matches?.('div,section,article,aside,main'))darkenDynamic(node.parentElement||document);}});observer.observe(document.documentElement,{childList:true,subtree:true});return true;}
export function runGlobalDarkThemeTest(){return css.includes('--wp-bg')&&css.includes('color-scheme:dark');}
if(typeof window!=='undefined'){window.worldGlobalDarkTheme={install:installGlobalDarkTheme,runTest:runGlobalDarkThemeTest};installGlobalDarkTheme();}
