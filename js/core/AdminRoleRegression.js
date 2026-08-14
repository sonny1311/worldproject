// WorldProject – prüft die Trennung zwischen Admin-Übersicht und Detailrechten.
import { adminControlSystem } from './AdminControlSystem.js';
import { adminWorldOverview, searchAdminPlayers } from './AdminDashboardData.js';
import { adminPageModel, adminNavigation } from './AdminFrontendModel.js';
export function runAdminRoleRegression(){
 const checks=[],check=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});
 const economy={id:'role-economy',role:'economy'},support={id:'role-support',role:'support'},ctx={players:[{id:'p1'}],companies:[{id:'c1',money:10}],world:{}};
 try{const overview=adminWorldOverview(economy,ctx);check('economy aggregate overview',overview.players===1&&overview.companies===1);check('economy snapshot',adminControlSystem.snapshot(economy,ctx).companies===1);const nav=adminNavigation(economy,adminControlSystem);check('economy sees economy',nav.some(x=>x.id==='economy'));check('economy hides players',!nav.some(x=>x.id==='players'));check('economy overview model',adminPageModel(economy,adminControlSystem,'overview',ctx).data.companies===1);let playerBlocked=false;try{searchAdminPlayers(economy,ctx.players);}catch{playerBlocked=true;}check('economy player details blocked',playerBlocked);}catch(error){check('economy role',false,error.message);}
 try{const nav=adminNavigation(support,adminControlSystem);check('support sees players',nav.some(x=>x.id==='players'));check('support hides economy',!nav.some(x=>x.id==='economy'));}catch(error){check('support role',false,error.message);}
 const failed=checks.filter(x=>!x.success);return{success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks};
}
