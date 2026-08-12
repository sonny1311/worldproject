// WorldProject - zentrale Mehrsprachigkeit / Internationalisierung
export const DefaultTranslations={
 de:{missingMaterials:"Für diese Produktion fehlen noch:",plannedOutput:"Geplante Produktionsmenge",startProduction:"Produktion starten",materialNames:{malt:"Malz",hops:"Hopfen",yeast:"Hefe",water:"Wasser",bottles:"0,33-l-Flaschen",clean_bottles:"Gereinigte 0,33-l-Flaschen",caps:"Kronkorken",labels:"Etiketten"}},
 en:{missingMaterials:"The following materials are still missing:",plannedOutput:"Planned production quantity",startProduction:"Start production",materialNames:{malt:"Malt",hops:"Hops",yeast:"Yeast",water:"Water",bottles:"0.33 l bottles",clean_bottles:"Cleaned 0.33 l bottles",caps:"Crown caps",labels:"Labels"}},
 es:{missingMaterials:"Aún faltan los siguientes materiales:",plannedOutput:"Cantidad de producción prevista",startProduction:"Iniciar producción",materialNames:{malt:"Malta",hops:"Lúpulo",yeast:"Levadura",water:"Agua",bottles:"Botellas de 0,33 l",clean_bottles:"Botellas limpias de 0,33 l",caps:"Tapas corona",labels:"Etiquetas"}},
 zh:{missingMaterials:"本次生产仍缺少以下原料：",plannedOutput:"计划生产数量",startProduction:"开始生产",materialNames:{malt:"麦芽",hops:"啤酒花",yeast:"酵母",water:"水",bottles:"0.33升玻璃瓶",clean_bottles:"已清洗0.33升玻璃瓶",caps:"皇冠瓶盖",labels:"标签"}}
};
export class LocalizationSystem{
 constructor({translations=DefaultTranslations,defaultLocale="de"}={}){this.translations=translations;this.defaultLocale=defaultLocale;this.locale=this.detectLocale();}
 detectLocale(){const raw=(navigator.languages?.[0]||navigator.language||this.defaultLocale).toLowerCase();const exact=Object.keys(this.translations).find(k=>raw===k||raw.startsWith(k+"-"));return exact||this.defaultLocale;}
 setLocale(locale){if(!this.translations[locale])throw new Error("Sprache noch nicht verfügbar");this.locale=locale;localStorage.setItem("worldproject.locale",locale);return locale;}
 loadSavedLocale(){const saved=localStorage.getItem("worldproject.locale");if(saved&&this.translations[saved])this.locale=saved;return this.locale;}
 t(key,fallback=""){return key.split(".").reduce((o,k)=>o?.[k],this.translations[this.locale])??key.split(".").reduce((o,k)=>o?.[k],this.translations[this.defaultLocale])??fallback||key;}
 materialLabel(id){return this.t(`materialNames.${id}`,id);}
}
export const i18n=new LocalizationSystem();i18n.loadSavedLocale();
