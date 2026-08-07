// ============================================
// DataValidator.js
// WorldEngine
// Version 0.3.0
// ============================================

export class DataValidator {

    //----------------------------------------

    static validateProduct(product){

        return (

            typeof product.id === "string" &&

            typeof product.name === "string" &&

            typeof product.category === "string"

        );

    }

    //----------------------------------------

    static validateVehicle(vehicle){

        return (

            typeof vehicle.id === "string" &&

            typeof vehicle.name === "string"

        );

    }

    //----------------------------------------

    static validateBuilding(building){

        return (

            typeof building.id === "string" &&

            typeof building.name === "string"

        );

    }

    //----------------------------------------

    static validateArray(array, validator){

        if(!Array.isArray(array))
            return false;

        for(const item of array){

            if(!validator(item))
                return false;

        }

        return true;

    }

}