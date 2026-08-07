// ============================================
// assetManager.js
// WorldEngine
// Version 0.1.0
// ============================================

export class AssetManager {

    constructor() {

        this.images = new Map();
        this.sounds = new Map();

    }

    async loadImage(name, path) {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.onload = () => {

                this.images.set(name, img);

                resolve(img);

            };

            img.onerror = reject;

            img.src = path;

        });

    }

    getImage(name) {

        return this.images.get(name);

    }

}