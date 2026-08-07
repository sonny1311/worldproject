// ============================================
// ResourceManager.js
// WorldEngine
// Version 0.3.0
// ============================================

export class ResourceManager {

    constructor() {

        this.images = new Map();

        this.audio = new Map();

        this.json = new Map();

        this.fonts = new Map();

    }

    //----------------------------------------
    // Bild laden
    //----------------------------------------

    async loadImage(id, path){

        if(this.images.has(id))
            return this.images.get(id);

        return new Promise((resolve,reject)=>{

            const image = new Image();

            image.onload = ()=>{

                this.images.set(id,image);

                resolve(image);

            };

            image.onerror = reject;

            image.src = path;

        });

    }

    //----------------------------------------
    // Bild holen
    //----------------------------------------

    getImage(id){

        return this.images.get(id);

    }

    //----------------------------------------
    // JSON laden
    //----------------------------------------

    async loadJSON(id,path){

        if(this.json.has(id))
            return this.json.get(id);

        const response = await fetch(path);

        const data = await response.json();

        this.json.set(id,data);

        return data;

    }

    //----------------------------------------
    // JSON holen
    //----------------------------------------

    getJSON(id){

        return this.json.get(id);

    }

}