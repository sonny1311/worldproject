// Ergänzt die Brauerei um bisher fehlende beschaffbare Basisinputs.
import { registerWorldContent } from "../core/ContentRegistry.js";
registerWorldContent({suppliers:[
 {id:"brew_basics",industries:["brewery"],label:"Brauereibedarf Regional",materials:["yeast","water"],prices:{yeast:6.5,water:.01},distanceKm:18,deliveryBase:25,deliveryPerKm:.38,deliveryHours:4,quality:.97,reliability:.99}
]});
