// WorldProject - zentrale Initialisierung aller spielbaren Inhaltsdaten.
// Diese Datei muss beim Spielstart genau einmal importiert werden.
import "./GameContentData.js";
import "./MarketAndFleetContentData.js";
import "./WorkforceContentData.js";
import { registerWorldContent } from "../core/ContentRegistry.js";

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

console.log("✅ WORLDPROJECT-CONTENT GELADEN");
