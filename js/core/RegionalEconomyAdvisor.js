// ORVUNO – dynamische regionale Gruendungsempfehlungen und Hintergrundwirtschaft.
// Keine statische Empfehlung: Bedarf und vorhandene Kapazitaet werden bei jedem Aufruf neu bewertet.
const N=v=>Number.isFinite(Number(v))?Number(v):0;
export const INDUSTRY_OUTPUT={
 'Mühle':{unit:'t/Tag',capacity:9,products:['flour_wheat']},'Brauerei':{unit:'hl/Tag',capacity:18,products:['beer']},
 'Getränkegroßhandel':{unit:'Pal./Tag',capacity:24,products:['beverages']},'Spedition':{unit:'Touren/Tag',capacity:16,products:['freight']},
 'Glaswerk':{unit:'Tsd. Fl./Tag',capacity:30,products:['bottles','bottles_050']},'Verpackungshersteller':{unit:'Tsd./Tag',capacity:25,products:['caps','labels','packaging']},
 'Landwirtschaftsbetrieb':{unit:'t/Tag',capacity:12,products:['wheat','barley','hops']},'Mälzerei':{unit:'t/Tag',capacity:10,products:['malt']}
};
export const NEEDS_BY_BUSINESS={
 'Brauerei':['Mälzerei','Landwirtschaftsbetrieb','Glaswerk','Verpackungshersteller','Spedition','Getränkegroßhandel'],
 'Mühle':['Landwirtschaftsbetrieb','Spedition'], 'Bäckerei':['Mühle','Landwirtschaftsbetrieb','Verpackungshersteller','Spedition'],
 'Getränkehersteller':['Glaswerk','Verpackungshersteller','Spedition','Getränkegroßhandel'],
 'Tischlerei':['Sägewerk','Holzfällerbetrieb','Spedition'], 'Schreinerei':['Sägewerk','Holzfällerbetrieb','Spedition']
};
const normalize=s=>String(s||'').trim();
export class RegionalEconomyAdvisor{
 constructor({radiusKm=180}={}){this.radiusKm=radiusKm;}
 businesses(){const server=window.worldServerAccountOverview?.companies||[];const synthetic=window.worldRegionalSystemCompanies||[];return [...server,...synthetic];}
 typeOf(c){return normalize(c.company_type||c.type||c.businessType);}
 demandFor(type,businesses=this.businesses()){
  let demand=0;for(const c of businesses){const needs=NEEDS_BY_BUSINESS[this.typeOf(c)]||[];if(needs.includes(type))demand+=INDUSTRY_OUTPUT[type]?.capacity||9;}
  // Eine junge Region soll auch ohne bestehende Abnehmer einen kleinen Grundbedarf haben.
  return Math.max(demand,INDUSTRY_OUTPUT[type]?.capacity||9);
 }
 capacityFor(type,businesses=this.businesses()){return businesses.filter(c=>this.typeOf(c)===type).reduce((s,c)=>s+N(c.regionalCapacity||c.capacity||INDUSTRY_OUTPUT[type]?.capacity||9),0);}
 evaluate(type,{businesses=this.businesses()}={}){const demand=this.demandFor(type,businesses),capacity=this.capacityFor(type,businesses),add=INDUSTRY_OUTPUT[type]?.capacity||9,after=capacity+add,ratio=demand?capacity/demand:1;let state='balanced',score=50;if(ratio<.8){state='needed';score=Math.round(70+(1-ratio)*30);}else if(ratio>1.2){state='oversupplied';score=Math.max(0,Math.round(50-(ratio-1)*30));}return{type,state,score,demand,capacity,after,unit:INDUSTRY_OUTPUT[type]?.unit||'Kapazität/Tag',recommended:state==='needed'};}
 recommendations(types=[]){return [...new Set(types)].map(type=>this.evaluate(type)).sort((a,b)=>b.score-a.score);}
 ensureSupportFor(company){const type=this.typeOf(company),needed=NEEDS_BY_BUSINESS[type]||[],created=[];window.worldRegionalSystemCompanies=window.worldRegionalSystemCompanies||[];for(const supportType of needed){const e=this.evaluate(supportType);if(e.capacity>=e.demand*.9)continue;const id=`regional-${supportType.toLowerCase().replace(/[^a-z0-9]+/gi,'-')}-${window.worldRegionalSystemCompanies.length+1}`;const city=company?.location?.city||company?.city||'Region';const c={id,name:`${city} ${supportType} ${window.worldRegionalSystemCompanies.length+1}`,company_type:supportType,type:supportType,regionalCapacity:INDUSTRY_OUTPUT[supportType]?.capacity||9,systemManaged:true,regionId:company?.regionId||company?.region_id||company?.location?.regionId||'local',location:{city,regionId:company?.regionId||company?.region_id||'local'}};window.worldRegionalSystemCompanies.push(c);created.push(c);}
  window.dispatchEvent(new CustomEvent('world:regional-economy-updated',{detail:{company,created,recommendations:this.recommendations(needed)}}));return created;}
}
export const regionalEconomyAdvisor=new RegionalEconomyAdvisor();
export function runRegionalEconomyAdvisorTest(){const a=new RegionalEconomyAdvisor(),businesses=[{company_type:'Brauerei'},{company_type:'Brauerei'}],m=a.evaluate('Mühle',{businesses}),g=a.evaluate('Glaswerk',{businesses});if(!g.recommended||g.demand<=0||m.after<=m.capacity)throw new Error('Regionalanalyse fehlerhaft');return{success:true,mill:m,glass:g};}
if(typeof window!=='undefined')window.worldRegionalEconomyAdvisor=regionalEconomyAdvisor;
