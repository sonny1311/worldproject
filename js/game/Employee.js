// ============================================
// Employee.js
// WorldEngine
// Version 0.2.0
// ============================================

export class Employee {

    constructor(firstName, lastName) {

        this.id = crypto.randomUUID();

        // Persönliche Daten
        this.firstName = firstName;
        this.lastName = lastName;

        this.age = 18;

        // Beruf
        this.job = "Aushilfe";

        this.salary = 2200;

        // Fähigkeiten (0-100)
        this.skills = {

            friendliness: 50,
            speed: 50,
            accuracy: 50,
            sales: 50,
            logistics: 50,
            leadership: 50

        };

        // Erfahrung

        this.experience = 0;

        this.level = 1;

        // Stimmung

        this.motivation = 100;

        this.stress = 0;

        this.satisfaction = 100;

        // Karriere

        this.training = [];

        this.company = null;

        this.branch = null;

    }

    //-------------------------------------

    addExperience(value){

        this.experience += value;

        if(this.experience >= this.level * 100){

            this.level++;

            this.experience = 0;

        }

    }

    //-------------------------------------

    improveSkill(skill,value){

        if(this.skills[skill] === undefined)
            return;

        this.skills[skill] += value;

        if(this.skills[skill] > 100)
            this.skills[skill] = 100;

    }

}