// WorldProject – isolierter Admin-Workspace-Controller. Wird nur im Admin-Einstieg geladen.
export const ADMIN_WORKSPACE_SECTIONS=Object.freeze(['overview','players','companies','economy','market','products','suppliers','production','transport','alliances','premium','coins','awards','languages','npc','support','moderation','liveops','system','audit']);
const HIGH_RISK=['money','inventory','ban','suspend','delete','world','feature','premium','coins','market','registration','maintenance','alliance'];
export class AdminWorkspaceController{
 constructor({control=null,dashboard=null,audit=null}={}){this.control=control||(typeof window!=='undefined'?window.worldAdminControl:null);this.dashboard=dashboard||(typeof window!=='undefined'?window.worldAdminDashboard:null);this.audit=audit||(typeof window!=='undefined'?window.worldAdminAudit:null);this.state={section:'overview',query:'',selected:null,pendingAction:null,lastResult:null,history:[]};}
 navigate(section){if(!ADMIN_WORKSPACE_SECTIONS.includes(section))throw new Error(`Unbekannter Adminbereich: ${section}`);this.state.section=section;this.state.selected=null;return this.view();}
 search(query){this.state.query=String(query||'').trim();return this.view();}
 select(entity){this.state.selected=entity||null;return this.view();}
 preview(action,payload={}){const name=String(action||'').toLowerCase();const risk=HIGH_RISK.some(k=>name.includes(k))?'high':'normal';this.state.pendingAction={action,payload,risk,createdAt:Date.now(),requiresConfirmation:risk==='high',requiresReason:risk==='high'};return this.state.pendingAction;}
 cancelPending(){this.state.pendingAction=null;return this.view();}
 async execute({confirmed=false,reason=''}={}){const p=this.state.pendingAction;if(!p)throw new Error('Keine Admin-Aktion vorbereitet');if(p.requiresConfirmation&&!confirmed)throw new Error('Bestätigung erforderlich');if(p.requiresReason&&!String(reason||'').trim())throw new Error('Begründung für kritische Admin-Aktion erforderlich');if(!this.control?.execute)throw new Error('Admin-Control nicht verfügbar');const cleanReason=String(reason||'').trim();const result=await this.control.execute(p.action,{...p.payload,reason:cleanReason});const record={action:p.action,risk:p.risk,result,at:Date.now()};this.state.pendingAction=null;this.state.lastResult=record;this.state.history.push(record);if(this.state.history.length>100)this.state.history.shift();return result;}
 view(){return{...this.state,sections:[...ADMIN_WORKSPACE_SECTIONS],generatedAt:Date.now()};}
}
if(typeof window!=='undefined')window.worldAdminWorkspaceController=AdminWorkspaceController;
