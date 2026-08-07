// ============================================
// EventBus.js
// WorldEngine
// Version 0.2.0
// ============================================

export class EventBus {

    constructor() {

        this.listeners = {};

    }

    //----------------------------------------

    on(event, callback){

        if(!this.listeners[event]){

            this.listeners[event] = [];

        }

        this.listeners[event].push(callback);

    }

    //----------------------------------------

    emit(event, data = null){

        if(!this.listeners[event])
            return;

        for(const callback of this.listeners[event]){

            callback(data);

        }

    }

    //----------------------------------------

    off(event, callback){

        if(!this.listeners[event])
            return;

        this.listeners[event] =

            this.listeners[event].filter(

                listener => listener !== callback

            );

    }

}