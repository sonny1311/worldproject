// WorldProject - zentrale Initialisierung aller spielbaren Inhaltsdaten.
// Diese Datei muss beim Spielstart genau einmal importiert werden.
import "./GameContentData.js";
import "./MarketAndFleetContentData.js";
import "./WorkforceContentData.js";
import { registerWorldContent, worldContentRegistry } from "../core/ContentRegistry.js";

// Bruecke zwischen sichtbaren deutschen Betriebstypen und den internen
// branchKeys, die Lieferanten, Rezepte und Produktionssysteme verwenden.
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
    { id:"Einzelhandel", branchKey:"retail", label:"Einzelhandel" },
    { id:"Großhandel", branchKey:"wholesale", label:"Großhandel" },
    { id:"Onlinehandel", branchKey:"online_retail", label:"Onlinehandel" }
  ]
});

// Ein Betrieb speichert zwei verschiedene Angaben:
// company.industry = Obergruppe (z. B. "Getränke")
// company.type     = konkreter Betriebstyp (z. B. "Brauerei")
// Die operative Lieferkette prueft branchKey vor industry. Deshalb wird der
// branchKey beim Laden aus dem konkreten Betriebstyp gesetzt. Ohne diese
// Bruecke wurde "Getränke" als branchKey verwendet und es gab 0 Lieferanten.
function applyCompanyBranchKey(company){
  if(!company)return null;
  const type=company.type||company.company_type||"";
  const typeEntry=worldContentRegistry.get("industries",type);
  if(typeEntry?.branchKey){
    company.branchKey=typeEntry.branchKey;
    return company.branchKey;
  }
  const industry=company.industry||"";
  const industryEntry=worldContentRegistry.get("industries",industry);
  if(industryEntry?.branchKey){
    company.branchKey=industryEntry.branchKey;
    return company.branchKey;
  }
  return company.branchKey||null;
}

for(const eventName of ["worldproject:company-loaded","worldproject:company-founded","worldproject:company-switched","worldproject:company-activated"]){
  window.addEventListener(eventName,event=>{
    const company=event?.detail?.company||window.worldPlayerCompany;
    const branchKey=applyCompanyBranchKey(company);
    if(branchKey)console.log("✅ BETRIEBSZWEIG AUFGELÖST",{type:company?.type,industry:company?.industry,branchKey});
  });
}

// Falls der Betrieb bereits vor diesem Modul gesetzt wurde.
applyCompanyBranchKey(window.worldPlayerCompany);

console.log("✅ WORLDPROJECT-CONTENT GELADEN");
