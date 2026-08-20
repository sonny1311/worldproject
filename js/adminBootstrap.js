// WorldProject / ORVUNO – robuster In-Game-Adminstart.
// Der Admin-Kern lädt immer zuerst. Zusatzmodule dürfen den kompletten Adminbereich
// nicht mehr durch einen einzelnen Syntax-/Importfehler blockieren.
import { adminControlSystem } from "./core/AdminControlSystem.js";
import { createAdminFrontend } from "./core/AdminFrontendModel.js";
import { AdminWorkspaceController } from "./core/AdminWorkspaceController.js";
import { mountAdminConsole } from "./core/AdminConsoleUI.js";

const OPTIONAL_MODULES=[
  "./core/AdminConsoleSectionViews.js",
  "./core/AdminConsoleActionViews.js",
  "./core/AdminCompensationConsoleView.js",
  "./core/AdminTesterToolsIntegration.js",
  "./core/AdminAuditAnalytics.js",
  "./core/AdminAuditConsoleView.js",
  "./core/AdminPersistentAuditView.js",
  "./core/AdminRoleManagementView.js",
  "./core/AdminServerRefreshView.js",
  "./core/AdminCurrencySystem.js",
  "./core/AdminCurrencyConsoleView.js",
  "./core/AdminSupplierAwardConsoleViews.js",
  "./core/AdminSupplierControl.js",
  "./core/AdminNpcControl.js",
  "./core/AdminSupplierNpcActionViews.js",
  "./core/AdminSupportSlaSystem.js",
  "./core/AdminSupportSlaConsoleView.js",
  "./core/AdminProductAwardControl.js",
  "./core/AdminProductAwardActionViews.js",
  "./core/AdminSystemHealth.js",
  "./core/AdminSystemHealthConsoleView.js",
  "./core/ModerationCaseSystem.js",
  "./core/LiveOpsSystem.js",
  "./core/AdminBalancingSystem.js",
  "./core/SupportCaseSystem.js",
  "./core/AdminSecurityIntegration.js",
  "./core/AdminReleaseControl.js",
  "./core/AllianceSystem.js",
  "./core/AllianceAdvancedSystem.js",
  "./core/AllianceLaunchGuard.js"
];

async function loadOptionalModules(){
  const loaded=[];
  const failed=[];
  for(const path of OPTIONAL_MODULES){
    try{
      await import(path);
      loaded.push(path);
    }catch(error){
      const entry={path,error:error?.message||String(error)};
      failed.push(entry);
      console.error("❌ ORVUNO Admin-Zusatzmodul konnte nicht geladen werden",entry,error);
    }
  }
  if(typeof window!=="undefined")window.worldAdminModuleLoadStatus={loaded,failed};
  return {loaded,failed};
}

export async function startWorldProjectAdmin({actor,context={},loadAdminUi=null,mount=null}={}){
  adminControlSystem.requireAdmin(actor);

  // Zusatzmodule zuerst versuchen, aber Fehler isolieren.
  const modules=await loadOptionalModules();

  const frontend=createAdminFrontend(actor,adminControlSystem,context);
  const workspace=new AdminWorkspaceController({
    control:adminControlSystem,
    dashboard:typeof window!=="undefined"?window.worldAdminDashboard:null,
    audit:typeof window!=="undefined"?window.worldAdminAudit:null
  });

  let ui=null;
  if(typeof loadAdminUi==="function"){
    await loadAdminUi({actor,adminControlSystem,frontend,workspace,modules});
  }else if(typeof document!=="undefined"){
    ui=mountAdminConsole({actor,admin:adminControlSystem,context,frontend,workspace,mount:mount||document.body});
  }

  if(modules.failed.length){
    console.warn(`⚠️ ORVUNO Admin geöffnet, ${modules.failed.length} Zusatzmodul(e) fehlerhaft`,modules.failed);
  }else{
    console.log("✅ ORVUNO ADMIN-BEREICH vollständig geladen");
  }

  return {actor,adminControlSystem,frontend,workspace,ui,modules};
}

if(typeof window!=="undefined")window.startWorldProjectAdmin=startWorldProjectAdmin;
