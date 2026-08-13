// WorldProject - zentrale Internationalisierung (i18n)
// Alle sichtbaren Texte sollen langfristig ueber Schluessel laufen statt fest im UI zu stehen.
export const SupportedLocales={
  de:{label:"Deutsch",nativeLabel:"Deutsch"},
  en:{label:"English",nativeLabel:"English"},
  es:{label:"Spanish",nativeLabel:"Español"},
  fr:{label:"French",nativeLabel:"Français"},
  it:{label:"Italian",nativeLabel:"Italiano"},
  nl:{label:"Dutch",nativeLabel:"Nederlands"},
  pl:{label:"Polish",nativeLabel:"Polski"},
  pt:{label:"Portuguese",nativeLabel:"Português"},
  tr:{label:"Turkish",nativeLabel:"Türkçe"},
  ru:{label:"Russian",nativeLabel:"Русский"},
  uk:{label:"Ukrainian",nativeLabel:"Українська"},
  ar:{label:"Arabic",nativeLabel:"العربية"},
  zh:{label:"Chinese",nativeLabel:"中文"},
  ja:{label:"Japanese",nativeLabel:"日本語"},
  ko:{label:"Korean",nativeLabel:"한국어"},
  hi:{label:"Hindi",nativeLabel:"हिन्दी"}
};

const dictionaries={
  de:{
    "production.missing_title":"Für diese Produktion fehlen noch:",
    "production.target_quantity":"Gewünschte Produktionsmenge",
    "production.required_for":"Benötigt für {quantity} {unit} {product}",
    "production.start":"Produktion starten",
    "production.queue":"Produktion einplanen",
    "production.start_planned":"Geplante Produktion starten",
    "production.delete_planned":"Planung löschen",
    "production.pause":"Pausieren",
    "production.resume":"Fortsetzen",
    "production.cannot_start":"Geplante Produktion kann derzeit nicht gestartet werden. Prüfe Rohstoffe und Maschinenverfügbarkeit.",
    "production.brew_master_required":"Für die Bierproduktion wird ein aktiver Braumeister benötigt.",
    "production.take_order_quantity":"Fehlmenge aus Auftrag übernehmen",
    "operations.open":"Einkauf, Lager & Produktion öffnen",
    "operations.manage_hint":"Einkauf, Lieferungen, Lager und Produktionsplanung werden gemeinsam im operativen Betriebsdialog verwaltet.",
    "operations.supply_title":"📦 Lieferungen & Einkauf",
    "operations.production_title":"🏗️ Produktion",
    "economy.insufficient_funds":"Nicht genug Firmenvermögen: {required} benötigt, {available} verfügbar.",
    "status.order.ordered":"Bestellt","status.order.in_transit":"Unterwegs","status.order.arrived":"Angekommen","status.order.stored":"Eingelagert","status.order.delayed":"Verspätet","status.order.cancelled":"Storniert",
    "status.production.queued":"Geplant","status.production.available":"Bereit","status.production.running":"In Produktion","status.production.paused":"Pausiert","status.production.finished":"Fertig","status.production.cancelled":"Abgebrochen",
    "time.arrived":"angekommen","time.unknown":"unbekannt",
    "storage.raw":"Rohstofflager","storage.packaging":"Verpackungslager","storage.finished":"Fertigwarenlager","storage.cold":"Kühllager",
    "materials.malt":"Malz","materials.hops":"Hopfen","materials.yeast":"Hefe","materials.water":"Wasser",
    "materials.bottles":"0,33-l-Flaschen","materials.clean_bottles":"Gereinigte 0,33-l-Flaschen","materials.caps":"Kronkorken","materials.labels":"Etiketten",
    "units.kg":"kg","units.l":"l","units.pcs":"Stück","units.m2":"m²","units.m3":"m³"
  },
  en:{
    "production.missing_title":"Still required for this production:",
    "production.target_quantity":"Target production quantity",
    "production.required_for":"Required for {quantity} {unit} of {product}",
    "production.start":"Start production",
    "production.queue":"Schedule production",
    "production.start_planned":"Start planned production",
    "production.delete_planned":"Delete plan",
    "production.pause":"Pause",
    "production.resume":"Resume",
    "production.cannot_start":"The planned production cannot be started right now. Check materials and machine availability.",
    "production.brew_master_required":"An active brewmaster is required for beer production.",
    "production.take_order_quantity":"Use missing quantity from order",
    "operations.open":"Open purchasing, storage & production",
    "operations.manage_hint":"Purchasing, deliveries, storage and production planning are managed together in the operations dialog.",
    "operations.supply_title":"📦 Deliveries & purchasing",
    "operations.production_title":"🏗️ Production",
    "economy.insufficient_funds":"Insufficient company funds: {required} required, {available} available.",
    "status.order.ordered":"Ordered","status.order.in_transit":"In transit","status.order.arrived":"Arrived","status.order.stored":"Stored","status.order.delayed":"Delayed","status.order.cancelled":"Cancelled",
    "status.production.queued":"Planned","status.production.available":"Ready","status.production.running":"In production","status.production.paused":"Paused","status.production.finished":"Finished","status.production.cancelled":"Cancelled",
    "time.arrived":"arrived","time.unknown":"unknown",
    "storage.raw":"Raw materials","storage.packaging":"Packaging","storage.finished":"Finished goods","storage.cold":"Cold storage",
    "materials.malt":"Malt","materials.hops":"Hops","materials.yeast":"Yeast","materials.water":"Water",
    "materials.bottles":"0.33 l bottles","materials.clean_bottles":"Clean 0.33 l bottles","materials.caps":"Bottle caps","materials.labels":"Labels",
    "units.kg":"kg","units.l":"l","units.pcs":"pcs","units.m2":"m²","units.m3":"m³"
  },
  es:{
    "production.missing_title":"Para esta producción todavía falta:",
    "production.target_quantity":"Cantidad de producción deseada",
    "production.required_for":"Necesario para {quantity} {unit} de {product}",
    "production.start":"Iniciar producción",
    "production.queue":"Planificar producción",
    "production.start_planned":"Iniciar producción planificada",
    "production.delete_planned":"Eliminar planificación",
    "production.pause":"Pausar",
    "production.resume":"Continuar",
    "production.cannot_start":"La producción planificada no se puede iniciar ahora. Comprueba los materiales y la disponibilidad de las máquinas.",
    "production.brew_master_required":"Se necesita un maestro cervecero activo para producir cerveza.",
    "production.take_order_quantity":"Usar la cantidad pendiente del pedido",
    "operations.open":"Abrir compras, almacén y producción",
    "operations.manage_hint":"Las compras, entregas, el almacén y la planificación de producción se gestionan conjuntamente en el diálogo operativo.",
    "operations.supply_title":"📦 Entregas y compras",
    "operations.production_title":"🏗️ Producción",
    "economy.insufficient_funds":"Fondos insuficientes de la empresa: se requieren {required}, hay {available} disponibles.",
    "status.order.ordered":"Pedido","status.order.in_transit":"En tránsito","status.order.arrived":"Llegado","status.order.stored":"Almacenado","status.order.delayed":"Retrasado","status.order.cancelled":"Cancelado",
    "status.production.queued":"Planificado","status.production.available":"Listo","status.production.running":"En producción","status.production.paused":"Pausado","status.production.finished":"Finalizado","status.production.cancelled":"Cancelado",
    "time.arrived":"llegado","time.unknown":"desconocido",
    "storage.raw":"Materias primas","storage.packaging":"Embalaje","storage.finished":"Productos terminados","storage.cold":"Almacén frigorífico",
    "materials.malt":"Malta","materials.hops":"Lúpulo","materials.yeast":"Levadura","materials.water":"Agua",
    "materials.bottles":"Botellas de 0,33 l","materials.clean_bottles":"Botellas limpias de 0,33 l","materials.caps":"Chapas","materials.labels":"Etiquetas",
    "units.kg":"kg","units.l":"l","units.pcs":"uds.","units.m2":"m²","units.m3":"m³"
  },
  zh:{
    "production.missing_title":"本次生产仍缺少：",
    "production.target_quantity":"计划生产数量",
    "production.required_for":"生产 {quantity} {unit} {product} 所需",
    "production.start":"开始生产",
    "production.queue":"安排生产",
    "production.start_planned":"开始已计划生产",
    "production.delete_planned":"删除计划",
    "production.pause":"暂停",
    "production.resume":"继续",
    "production.cannot_start":"当前无法开始已计划生产。请检查原料和机器可用性。",
    "production.brew_master_required":"啤酒生产需要一名在岗酿酒师傅。",
    "production.take_order_quantity":"采用订单缺口数量",
    "operations.open":"打开采购、仓储和生产",
    "operations.manage_hint":"采购、配送、仓储和生产计划统一在运营对话框中管理。",
    "operations.supply_title":"📦 配送与采购",
    "operations.production_title":"🏗️ 生产",
    "economy.insufficient_funds":"公司资金不足：需要 {required}，可用 {available}。",
    "status.order.ordered":"已下单","status.order.in_transit":"运输中","status.order.arrived":"已到达","status.order.stored":"已入库","status.order.delayed":"延误","status.order.cancelled":"已取消",
    "status.production.queued":"已计划","status.production.available":"可开始","status.production.running":"生产中","status.production.paused":"已暂停","status.production.finished":"已完成","status.production.cancelled":"已取消",
    "time.arrived":"已到达","time.unknown":"未知",
    "storage.raw":"原料仓库","storage.packaging":"包装仓库","storage.finished":"成品仓库","storage.cold":"冷藏库",
    "materials.malt":"麦芽","materials.hops":"啤酒花","materials.yeast":"酵母","materials.water":"水",
    "materials.bottles":"0.33升玻璃瓶","materials.clean_bottles":"已清洗0.33升玻璃瓶","materials.caps":"瓶盖","materials.labels":"标签",
    "units.kg":"公斤","units.l":"升","units.pcs":"件","units.m2":"平方米","units.m3":"立方米"
  }
};

export class InternationalizationSystem{
 constructor({locale=null,fallback="en"}={}){this.fallback=fallback;this.locale=this.normalize(locale||this.detectLocale());}
 normalize(locale){const l=String(locale||"").toLowerCase().replace("_","-");const base=l.split("-")[0];return SupportedLocales[base]?base:(SupportedLocales[this.fallback]?this.fallback:"en");}
 detectLocale(){return navigator.languages?.[0]||navigator.language||"en";}
 setLocale(locale){this.locale=this.normalize(locale);try{localStorage.setItem("worldproject.locale",this.locale);}catch{}window.dispatchEvent(new CustomEvent("world:locale-changed",{detail:{locale:this.locale}}));return this.locale;}
 loadSavedLocale(){try{const saved=localStorage.getItem("worldproject.locale");if(saved)this.locale=this.normalize(saved);}catch{}return this.locale;}
 addDictionary(locale,entries){const l=this.normalize(locale);dictionaries[l]={...(dictionaries[l]||{}),...(entries||{})};}
 t(key,vars={}){const dict=dictionaries[this.locale]||{},fallback=dictionaries[this.fallback]||dictionaries.en||{};let text=dict[key]??fallback[key]??key;for(const[k,v]of Object.entries(vars))text=text.replaceAll(`{${k}}`,String(v));return text;}
 materialLabel(id){return this.t(`materials.${id}`);}
 formatNumber(value,{maximumFractionDigits=2}={}){return new Intl.NumberFormat(this.locale,{maximumFractionDigits}).format(Number(value||0));}
}

export const i18n=new InternationalizationSystem();
i18n.loadSavedLocale();
window.worldI18n=i18n;