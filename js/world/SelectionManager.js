// ============================================
// SelectionManager.js
// WorldEngine
// Version 0.1.0
// ============================================

export class SelectionManager {

    constructor(engine) {

        this.engine = engine;

        this.selectedX = -1;
        this.selectedY = -1;

    }

    //----------------------------------------

    clear() {

        this.selectedX = -1;
        this.selectedY = -1;

    }

    //----------------------------------------

    select(x, y) {

        this.selectedX = x;
        this.selectedY = y;

    }

    //----------------------------------------

    hasSelection() {

        return this.selectedX >= 0 &&
               this.selectedY >= 0;

    }

}