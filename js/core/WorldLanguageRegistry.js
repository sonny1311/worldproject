// WorldProject - zentrale Sprachabdeckung fuer internationale Spieler
// Sprachcodes folgen weitgehend BCP-47/ISO-Konventionen. Neue Sprachen koennen ohne Aenderung der Spiellogik ergaenzt werden.

export const WorldLanguages = [
  // Europa
  {code:"de",name:"Deutsch",nativeName:"Deutsch",region:"Europe"},
  {code:"en",name:"English",nativeName:"English",region:"Europe/Global"},
  {code:"fr",name:"French",nativeName:"Français",region:"Europe"},
  {code:"es",name:"Spanish",nativeName:"Español",region:"Europe/Global"},
  {code:"pt",name:"Portuguese",nativeName:"Português",region:"Europe/Global"},
  {code:"it",name:"Italian",nativeName:"Italiano",region:"Europe"},
  {code:"nl",name:"Dutch",nativeName:"Nederlands",region:"Europe"},
  {code:"da",name:"Danish",nativeName:"Dansk",region:"Europe"},
  {code:"sv",name:"Swedish",nativeName:"Svenska",region:"Europe"},
  {code:"no",name:"Norwegian",nativeName:"Norsk",region:"Europe"},
  {code:"fi",name:"Finnish",nativeName:"Suomi",region:"Europe"},
  {code:"is",name:"Icelandic",nativeName:"Íslenska",region:"Europe"},
  {code:"fo",name:"Faroese",nativeName:"Føroyskt",region:"Europe"},
  {code:"pl",name:"Polish",nativeName:"Polski",region:"Europe"},
  {code:"cs",name:"Czech",nativeName:"Čeština",region:"Europe"},
  {code:"sk",name:"Slovak",nativeName:"Slovenčina",region:"Europe"},
  {code:"sl",name:"Slovenian",nativeName:"Slovenščina",region:"Europe"},
  {code:"hr",name:"Croatian",nativeName:"Hrvatski",region:"Europe"},
  {code:"bs",name:"Bosnian",nativeName:"Bosanski",region:"Europe"},
  {code:"sr",name:"Serbian",nativeName:"Српски",region:"Europe"},
  {code:"me",name:"Montenegrin",nativeName:"Crnogorski",region:"Europe"},
  {code:"mk",name:"Macedonian",nativeName:"Македонски",region:"Europe"},
  {code:"sq",name:"Albanian",nativeName:"Shqip",region:"Europe"},
  {code:"el",name:"Greek",nativeName:"Ελληνικά",region:"Europe"},
  {code:"bg",name:"Bulgarian",nativeName:"Български",region:"Europe"},
  {code:"ro",name:"Romanian",nativeName:"Română",region:"Europe"},
  {code:"hu",name:"Hungarian",nativeName:"Magyar",region:"Europe"},
  {code:"et",name:"Estonian",nativeName:"Eesti",region:"Europe"},
  {code:"lv",name:"Latvian",nativeName:"Latviešu",region:"Europe"},
  {code:"lt",name:"Lithuanian",nativeName:"Lietuvių",region:"Europe"},
  {code:"ga",name:"Irish",nativeName:"Gaeilge",region:"Europe"},
  {code:"cy",name:"Welsh",nativeName:"Cymraeg",region:"Europe"},
  {code:"gd",name:"Scottish Gaelic",nativeName:"Gàidhlig",region:"Europe"},
  {code:"mt",name:"Maltese",nativeName:"Malti",region:"Europe"},
  {code:"lb",name:"Luxembourgish",nativeName:"Lëtzebuergesch",region:"Europe"},
  {code:"ca",name:"Catalan",nativeName:"Català",region:"Europe"},
  {code:"eu",name:"Basque",nativeName:"Euskara",region:"Europe"},
  {code:"gl",name:"Galician",nativeName:"Galego",region:"Europe"},
  {code:"uk",name:"Ukrainian",nativeName:"Українська",region:"Europe"},
  {code:"be",name:"Belarusian",nativeName:"Беларуская",region:"Europe"},
  {code:"ru",name:"Russian",nativeName:"Русский",region:"Europe/Asia"},
  {code:"tr",name:"Turkish",nativeName:"Türkçe",region:"Europe/Asia"},
  {code:"hy",name:"Armenian",nativeName:"Հայերեն",region:"Europe/Asia"},
  {code:"ka",name:"Georgian",nativeName:"ქართული",region:"Europe/Asia"},
  {code:"az",name:"Azerbaijani",nativeName:"Azərbaycanca",region:"Europe/Asia"},

  // Wichtige Weltsprachen / angrenzende Regionen
  {code:"zh-CN",name:"Chinese (Simplified)",nativeName:"简体中文",region:"Asia"},
  {code:"zh-TW",name:"Chinese (Traditional)",nativeName:"繁體中文",region:"Asia"},
  {code:"ja",name:"Japanese",nativeName:"日本語",region:"Asia"},
  {code:"ko",name:"Korean",nativeName:"한국어",region:"Asia"},
  {code:"ar",name:"Arabic",nativeName:"العربية",region:"Middle East/Africa",dir:"rtl"},
  {code:"he",name:"Hebrew",nativeName:"עברית",region:"Middle East",dir:"rtl"},
  {code:"fa",name:"Persian",nativeName:"فارسی",region:"Middle East",dir:"rtl"},
  {code:"hi",name:"Hindi",nativeName:"हिन्दी",region:"Asia"},
  {code:"bn",name:"Bengali",nativeName:"বাংলা",region:"Asia"},
  {code:"ur",name:"Urdu",nativeName:"اردو",region:"Asia",dir:"rtl"},
  {code:"id",name:"Indonesian",nativeName:"Bahasa Indonesia",region:"Asia"},
  {code:"ms",name:"Malay",nativeName:"Bahasa Melayu",region:"Asia"},
  {code:"vi",name:"Vietnamese",nativeName:"Tiếng Việt",region:"Asia"},
  {code:"th",name:"Thai",nativeName:"ไทย",region:"Asia"},
  {code:"sw",name:"Swahili",nativeName:"Kiswahili",region:"Africa"}
];

const byCode = new Map(WorldLanguages.map(l=>[l.code.toLowerCase(),l]));

export function normalizeLanguageCode(input="en"){
  const raw=String(input||"en").replace("_","-");
  const exact=byCode.get(raw.toLowerCase());
  if(exact)return exact.code;
  const base=raw.split("-")[0].toLowerCase();
  const direct=WorldLanguages.find(l=>l.code.toLowerCase()===base);
  if(direct)return direct.code;
  if(base==="zh")return raw.toLowerCase().includes("tw")||raw.toLowerCase().includes("hk")?"zh-TW":"zh-CN";
  return "en";
}

export function detectPlayerLanguage(navigatorLike=globalThis.navigator){
  const candidates=[...(navigatorLike?.languages||[]),navigatorLike?.language].filter(Boolean);
  for(const c of candidates){const normalized=normalizeLanguageCode(c);if(normalized)return normalized;}
  return "en";
}

export function languageInfo(code){return byCode.get(normalizeLanguageCode(code).toLowerCase())||byCode.get("en");}
export function languageDirection(code){return languageInfo(code)?.dir||"ltr";}
export function languagesForRegion(region){return WorldLanguages.filter(l=>l.region.includes(region));}
export function languageOptions(){return WorldLanguages.map(l=>({value:l.code,label:l.nativeName,secondary:l.name,dir:l.dir||"ltr"}));}
