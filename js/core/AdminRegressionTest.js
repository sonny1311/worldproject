// WorldProject – kompakter Regressionstest für die getrennte Admin-Schicht.
import { AdminControlSystem, AdminSections } from './AdminControlSystem.js';
import { setWorldPause, setWorldTimeScale, setMarketFactor, setRegionState } from './AdminWorldControl.js';
import { AdminWorkspaceController, ADMIN_WORKSPACE_SECTIONS } from './AdminWorkspaceController.js';
import { adminOperationalSection } from './AdminOperationsData.js';
import { createLiveEvent, scheduleRollout, createLiveAnnouncement } from './LiveOpsSystem.js';
import { openSupportCase, assignSupportCase, addSupportMessage, compensatePlayer } from './SupportCaseSystem.js';
export function runAdminRegressionTest(){
 const checks=[],check=(name,ok,detail=null)=>checks.push({name,success:!!ok,detail});
 const admin=new AdminControlSystem(),actor={id:'test-admin',username:'TestAdmin',role:'admin'},world={},players=[{id:'p1',username:'A',coins:100,premium:true},{id:'p2',username:'B',coins:20,premium:false}],companies=[{id:'c1',name:'Betrieb',money:50000,productionJobs:[{id:'j1',status:'queued'}],deliveries:[{id:'d1',status:'ordered',eta:Date.now()+10000}],finishedGoods:{beer:10}}];
 check('admin role',admin.can(actor,'system.write'));
 check('world permission',admin.can(actor,'world.write'));
 check('products permission',admin.can(actor,'products.write'));
 check('premium permission',admin.can(actor,'premium.write'));
 check('all sections mirrored',Object.values(AdminSections).every(x=>ADMIN_WORKSPACE_SECTIONS.includes(x)));
 try{setWorldPause(world,{actor,paused:true,reason:'test'});check('world pause',world.adminWorld.paused===true);setWorldTimeScale(world,{actor,scale:2,reason:'test'});check('time scale',world.adminWorld.timeScale===2);setMarketFactor(world,{actor,key:'demand',value:1.2,reason:'test'});check('market factor',world.adminWorld.market.demand===1.2);setRegionState(world,{actor,regionId:'de-test',changes:{wages:1.1},reason:'test'});check('region control',world.adminWorld.regions['de-test'].wages===1.1);}catch(error){check('world controls',false,error.message);}
 try{const ctx={players,companies,world};check('economy data',adminOperationalSection('economy',ctx).companies===1);check('production data',adminOperationalSection('production',ctx).queued===1);check('transport data',adminOperationalSection('transport',ctx).open===1);check('premium data',adminOperationalSection('premium',ctx).premium===1);check('coins data',adminOperationalSection('coins',ctx).totalCoins===120);check('products data',adminOperationalSection('products',ctx).finishedStock[0].product==='beer');}catch(error){check('operational data',false,error.message);}
 try{createLiveEvent(world,{actor,name:'Testevent',effects:{demand:1.1}});scheduleRollout(world,{actor,feature:'feature-x',percentage:25});createLiveAnnouncement(world,{actor,title:'Test',message:'Hallo'});check('liveops create',world.liveOps.events.length===1&&world.liveOps.rollouts.length===1&&world.liveOps.announcements.length===1);}catch(error){check('liveops',false,error.message);}
 try{const support=openSupportCase(world,{playerId:'p1',subject:'Testfall'});assignSupportCase(world,{actor,caseId:support.id});addSupportMessage(world,{actor,caseId:support.id,text:'Antwort'});const player=players[0],before=player.coins;compensatePlayer(world,{actor,caseId:support.id,player,coins:5,reason:'Testkulanz'});check('support workflow',player.coins===before+5);}catch(error){check('support workflow',false,error.message);}
 check('audit generated',admin.audit(actor).length>=8,admin.audit(actor).length);
 const workspace=new AdminWorkspaceController({control:{execute:async()=>({success:true})}});try{workspace.navigate('premium');check('workspace navigation',workspace.state.section==='premium');let rejected=false;try{workspace.navigate('does-not-exist');}catch{rejected=true;}check('invalid section rejected',rejected);}catch(error){check('workspace',false,error.message);}
 const failed=checks.filter(x=>!x.success),result={success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks};
 if(typeof console!=='undefined')console[result.success?'log':'error'](`WORLDPROJECT ADMIN REGRESSION ${result.passed}/${result.total}`,result);
 return result;
}
