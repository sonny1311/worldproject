// Admin-Frontendmodell. Wird nur vom separaten adminBootstrap geladen.
import { AdminSections } from './AdminControlSystem.js';
import { adminSectionPayload } from './AdminDashboardData.js';
import { moderationKpis } from './ModerationCaseSystem.js';
import { supportKpis } from './SupportCaseSystem.js';
import { liveOpsKpis } from './LiveOpsSystem.js';
import { worldControlSnapshot } from './AdminWorldControl.js';
export function adminNavigation(actor,admin){admin.requireAdmin(actor);return Object.values(AdminSections).map(id=>({id,label:id[0].toUpperCase()+id.slice(1),allowed:true}));}
export function adminPageModel(actor,admin,section,context={}){admin.requireAdmin(actor);const world=context.world||{},base={section,navigation:adminNavigation(actor,admin),actor:{id:actor.id,name:actor.username||actor.name,role:actor.role},generatedAt:Date.now()};switch(section){case AdminSections.OVERVIEW:return{...base,data:adminSectionPayload(actor,'overview',context)};case AdminSections.PLAYERS:return{...base,data:adminSectionPayload(actor,'players',context)};case AdminSections.COMPANIES:return{...base,data:adminSectionPayload(actor,'companies',context)};case AdminSections.SYSTEM:return{...base,data:{settings:admin.getSettings(actor),liveOps:liveOpsKpis(world),world:worldControlSnapshot(world)}};case AdminSections.AUDIT:return{...base,data:{audit:admin.audit(actor),moderation:moderationKpis(world),support:supportKpis(world)}};default:return{...base,data:adminSectionPayload(actor,section,context)};}}
export function adminRoute(path='/admin/overview'){const raw=String(path).replace(/^.*\/admin\/?/,'').split(/[?#]/)[0]||'overview';return Object.values(AdminSections).includes(raw)?raw:AdminSections.OVERVIEW;}
export function createAdminFrontend(actor,admin,context={}){const state={section:AdminSections.OVERVIEW};return{state,navigate(section){state.section=adminRoute(`/admin/${section}`);return adminPageModel(actor,admin,state.section,context);},current(){return adminPageModel(actor,admin,state.section,context);},world(){return worldControlSnapshot(context.world||{});}};}
