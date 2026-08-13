// WorldProject - zentrale Initialisierung aller spielbaren Inhaltsdaten.
// Diese Datei muss beim Spielstart genau einmal importiert werden.
import "./GameContentData.js";
import "./AllIndustryEconomyContent.js";
import "./BrewerySupplySupplement.js";
import "./MarketAndFleetContentData.js";
import "./WorkforceContentData.js";
import { registerWorldContent, worldContentRegistry } from "../core/ContentRegistry.js";

registerWorldContent({
  industries: [
    { id:"Brauerei", branchKey:"brewery", label:"Brauerei" },
    { id:"Getränkehersteller", branchKey:"beverage", label:"Getränkehersteller" },
    { id:"Mineralbrunnen", branchKey:"beverage", label:"Mineralbrunnen" },
    { id:"Schreinerei", branchKey:"carpentry", label:"Schreinerei" },
    { id:"Tischlerei", branchKey:"carpentry", label:"Tischlerei" },
    { id:"Landwirtschaftsbetrieb", branchKey:"farm", label:"Landwirtschaftsbetrieb" },
    { id:"Tierhaltung", branchKey:"livestock", label:"Tierhaltung" },
    { id:"Obstbau", branchKey:"orchard", label:"Obstbau" },
    { id:"Bäckerei", branchKey:"bakery", label:"Bäckerei" },
    { id:"Metzgerei", branchKey:"butcher", label:"Metzgerei" },
    { id:"Lebensmittelhersteller", branchKey:"food", label:"Lebensmittelhersteller" },
    { id:"Maschinenbau", branchKey:"mechanical", label:"Maschinenbau" },
    { id:"Metallverarbeitung", branchKey:"metal", label:"Metallverarbeitung" },
    { id:"Kunststoffverarbeitung", branchKey:"plastic", label:"Kunststoffverarbeitung" },
    { id:"Einzelhandel", branchKey:"retail", label:"Einzelhandel" },
    { id:"Großhandel", branchKey:"wholesale", label:"Großhandel" },
    { id:"Onlinehandel", branchKey:"online_retail", label:"Onlinehandel" }
  ]
});
function applyCompanyBranchKey(company){
  if(!company)return null;
  const type=company.type||company.company_type||"";
  const typeEntry=worldContentRegistry.get("industries",type);
  if(typeEntry?.branchKey){company.branchKey=typeEntry.branchKey;return company.branchKey;}
  const industry=company.industry||"";
  const industryEntry=worldContentRegistry.get("industries",industry);
  if(industryEntry?.branchKey){company.branchKey=industryEntry.branchKey;return company.branchKey;}
  return company.branchKey||null;
}
for(const eventName of ["worldproject:company-loaded","worldproject:company-founded","worldproject:company-switched","worldproject:company-activated"]){
  window.addEventListener(eventName,event=>{
    const company=event?.detail?.company||window.worldPlayerCompany;
    const branchKey=applyCompanyBranchKey(company);
    if(branchKey)console.log("✅ BETRIEBSZWEIG AUFGELÖST",{type:company?.type,industry:company?.industry,branchKey});
  });
}
applyCompanyBranchKey(window.worldPlayerCompany);
console.log("✅ WORLDPROJECT-CONTENT GELADEN");
