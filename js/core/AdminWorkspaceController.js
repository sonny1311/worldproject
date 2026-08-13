// WorldProject – isolierter Admin-Workspace-Controller. Wird nur im Admin-Einstieg geladen.
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
export class AdminWorkspaceController{
 constructor({control=null,dashboard=null,audit=null}={}){this.control=control||window.worldAdminControl;this.dashboard=dashboard||window.worldAdminDashboard;this.audit=audit||window.worldAdminAudit;this.state={section:'overview',query:'',selected:null,pendingAction:null};}
 navigate(section){this.state.section=section;return this.view();}
 search(query){this.state.query=String(query||'').trim();return this.view();}
 select(entity){this.state.selected=entity||null;return this.view();}
 preview(action,payload={}){const risk=['money','inventory','ban','delete','world','feature_flag'].some(k=>String(action).includes(k))?'high':'normal';this.state.pendingAction={action,payload,risk,createdAt:Date.now(),requiresConfirmation:risk==='high'};return this.state.pendingAction;}
 async execute({confirmed=false,reason=''}={}){const p=this.state.pendingAction;if(!p)throw new Error('Keine Admin-Aktion vorbereitet');if(p.requiresConfirmation&&!confirmed)throw new Error('Bestätigung erforderlich');if(!this.control?.execute)throw new Error('Admin-Control nicht verfügbar');const result=await this.control.execute(p.action,{...p.payload,reason});this.state.pendingAction=null;return result;}
 view(){return{...this.state,sections:['overview','players','companies','economy','market','production','transport','support','moderation','world','features','audit'],generatedAt:Date.now()};}
}
if(typeof window!=='undefined')window.worldAdminWorkspaceController=AdminWorkspaceController;