// WorldProject – kompakter Regressionstest für die getrennte Admin-Schicht.
import { AdminControlSystem, AdminSections } from './AdminControlSystem.js';
import { setWorldPause, setWorldTimeScale, setMarketFactor, setRegionState } from './AdminWorldControl.js';
import { AdminWorkspaceController, ADMIN_WORKSPACE_SECTIONS } from './AdminWorkspaceController.js';
export function runAdminRegressionTest(){
 const checks=[],check=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});
 const admin=new AdminControlSystem(),actor={id:'test-admin',username:'TestAdmin',role:'admin'},world={};
 check('admin role',admin.can(actor,'system.write'));
 check('world permission',admin.can(actor,'world.write'));
 check('products permission',admin.can(actor,'products.write'));
 check('premium permission',admin.can(actor,'premium.write'));
 check('all sections mirrored',Object.values(AdminSections).every(x=>ADMIN_WORKSPACE_SECTIONS.includes(x)));
 try{setWorldPause(world,{actor,paused:true,reason:'test'});check('world pause',world.adminWorld.paused===true);setWorldTimeScale(world,{actor,scale:2,reason:'test'});check('time scale',world.adminWorld.timeScale===2);setMarketFactor(world,{actor,key:'demand',value:1.2,reason:'test'});check('market factor',world.adminWorld.market.demand===1.2);setRegionState(world,{actor,regionId:'de-test',changes:{wages:1.1},reason:'test'});check('region control',world.adminWorld.regions['de-test'].wages===1.1);}catch(error){check('world controls',false,error.message);}
 check('audit generated',admin.audit(actor).length>=4,admin.audit(actor).length);
 const workspace=new AdminWorkspaceController({control:{execute:async()=>({success:true})}});try{workspace.navigate('premium');check('workspace navigation',workspace.state.section==='premium');let rejected=false;try{workspace.navigate('does-not-exist');}catch{rejected=true;}check('invalid section rejected',rejected);}catch(error){check('workspace',false,error.message);}
 const failed=checks.filter(x=>!x.success),result={success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks};
 if(typeof console!=='undefined')console[result.success?'log':'error'](`WORLDPROJECT ADMIN REGRESSION ${result.passed}/${result.total}`,result);
 return result;
}
