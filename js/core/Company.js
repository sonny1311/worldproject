// ============================================
// Company.js
// WorldProject
//
// Zentrale Unternehmensklasse
//
// Enthält:
// - Unternehmensdaten
// - Finanzen
// - Grundstück
// - Gebäude
// - Ausstattung
// - Personal
// - Fahrzeuge
// - Lager
// - Produktion
// - Bauprojekte
// - Bauleiter
// - Materialbestellungen
// - aktive Baustofftransporte
// ============================================

import {
    Building
} from "./Building.js";

import {
    ConstructionManager
} from "./ConstructionManager.js";

import {
    ConstructionMaterialOrder
} from "./ConstructionMaterialOrder.js";

import {
    ConstructionMaterialTransport
} from "./ConstructionMaterialTransport.js";
import {
    GigaTransportService
} from "./GigaTransportService.js";


export class Company {

    constructor() {

        // ========================================
        // Grunddaten
        // ========================================

        this.name =
            "";

        this.industry =
            "";

        this.type =
            "";


        // ========================================
        // Finanzen
        // ========================================

        this.money =
            50000;

        this.coins =
            0;


        // ========================================
        // Grundstück
        // ========================================

        this.land = {

            size:
                100,

            expansionLevel:
                0
        };


        // ========================================
        // Gebäude
        // ========================================

        this.buildings =
            [];


        // ========================================
        // Ausstattung
        // ========================================

        this.equipment =
            [];


        // ========================================
        // Personal
        // ========================================

        this.employees =
            [];


        // ========================================
        // Fahrzeuge
        // ========================================

        this.vehicles =
            [];


        // ========================================
        // Lager
        // ========================================

        this.storage = {

            capacity:
                0,

            products:
                []
        };


        // ========================================
        // Produktion
        // ========================================

        this.production = {

            capacity:
                0,

            active:
                false
        };


        // ========================================
        // Bauprojekte
        // ========================================

        this.constructionProjects =
            [];


        // ========================================
        // Bauleiter je Bauprojekt
        // ========================================

        this.constructionManagers =
            new Map();


        // ========================================
        // Baustoffbestellungen
        // ========================================

        this.constructionMaterialOrders =
            [];


        // ========================================
        // Aktive Baustofftransporte
        // ========================================

        this.constructionMaterialTransports =
            [];


        // ========================================
        // Markt
        // ========================================

        this.market =
            null;


        // ========================================
        // Übergeordnetes Transportsystem
        // ========================================

        this.transportSystem =
            null;
// ========================================
// Giga-Transportservice
//
// Coin-Spezialtransporte:
// - Giga-LKW bis 54 Paletten
// - Schwerlast bis 60 t
// - Sondergenehmigung inklusive
// ========================================

this.gigaTransportService =
    new GigaTransportService(
        this
    );


        // ========================================
        // Laufende monatliche Kosten
        // ========================================

        this.monthlyCosts = {

            employees:
                0,

            electricity:
                0,

            water:
                0,

            maintenance:
                0,

            insurance:
                0,

            rent:
                0,

            other:
                0,

            total:
                0
        };
    }


    // ========================================
    // Gebäude hinzufügen
    // ========================================

    addBuilding(
        type,
        name,
        size = 100
    ) {

        const building =
            new Building(
                type,
                name,
                size
            );


        this.buildings.push(
            building
        );


        return building;
    }


    // ========================================
    // Markt setzen
    // ========================================

    setMarket(
        market
    ) {

        this.market =
            market;


        for (
            const manager
            of this.constructionManagers.values()
        ) {

            manager.market =
                market;
        }


        return true;
    }


    // ========================================
    // Transportsystem setzen
    // ========================================

    setTransportSystem(
        transportSystem
    ) {

        this.transportSystem =
            transportSystem;


        return true;
    }


    // ========================================
    // Fahrzeug hinzufügen
    // ========================================

    addVehicle(
        vehicle
    ) {

        if (!vehicle) {

            return false;
        }


        this.vehicles.push(
            vehicle
        );


        return true;
    }


    // ========================================
    // Fahrzeug suchen
    // ========================================

    getVehicleById(
        vehicleId
    ) {

        return (

            this.vehicles.find(

                vehicle =>
                    vehicle.id ===
                    vehicleId

            ) ?? null
        );
    }


    // ========================================
    // Verfügbare Fahrzeuge
    // ========================================

    getAvailableVehicles() {

        return this.vehicles.filter(

            vehicle => {

                if (
                    typeof vehicle.isAvailable ===
                    "function"
                ) {

                    return vehicle.isAvailable();
                }


                return (
                    vehicle.status ===
                    "available"
                );
            }
        );
    }


    // ========================================
    // Bauprojekt registrieren
    // ========================================

    addConstructionProject(
        construction
    ) {

        if (
            !construction
        ) {

            return {

                success:
                    false,

                reason:
                    "Kein Bauprojekt angegeben"
            };
        }


        const exists =
            this.constructionProjects.some(

                project =>
                    project.id ===
                    construction.id
            );


        if (
            exists
        ) {

            return {

                success:
                    false,

                reason:
                    "Bauprojekt bereits registriert"
            };
        }


        this.constructionProjects.push(
            construction
        );


        const manager =
            new ConstructionManager({

                construction,

                market:
                    this.market,

                company:
                    this
            });


        this.constructionManagers.set(

            construction.id,

            manager
        );


        return {

            success:
                true,

            construction,

            manager
        };
    }


    // ========================================
    // Bauprojekt suchen
    // ========================================

    getConstructionProject(
        constructionId
    ) {

        return (

            this.constructionProjects.find(

                construction =>
                    construction.id ===
                    constructionId

            ) ?? null
        );
    }


    // ========================================
    // Bauleiter holen
    // ========================================

    getConstructionManager(
        constructionId
    ) {

        return (

            this.constructionManagers.get(
                constructionId
            ) ?? null
        );
    }


    // ========================================
    // Einkaufsvorschlag erzeugen
    // ========================================

    createConstructionPurchaseProposal(
        constructionId
    ) {

        const manager =
            this.getConstructionManager(
                constructionId
            );


        if (!manager) {

            return {

                success:
                    false,

                reason:
                    "Kein Baustellenmanager vorhanden"
            };
        }


        return (
            manager.createDailyPurchaseProposal()
        );
    }


    // ========================================
    // Einkauf bestätigen
    // ========================================

    confirmConstructionPurchase(
        constructionId
    ) {

        const manager =
            this.getConstructionManager(
                constructionId
            );


        if (!manager) {

            return {

                success:
                    false,

                reason:
                    "Baustellenmanager nicht gefunden"
            };
        }


        const confirmation =
            manager.confirmProposal();


        if (
            !confirmation.success
        ) {

            return confirmation;
        }


        const proposal =
            confirmation.proposal;


        if (
            !proposal ||
            !Array.isArray(
                proposal.purchases
            ) ||
            proposal.purchases.length ===
            0
        ) {

            return {

                success:
                    false,

                reason:
                    "Keine Bestellpositionen vorhanden"
            };
        }


        const construction =
            this.getConstructionProject(
                constructionId
            );


        if (!construction) {

            return {

                success:
                    false,

                reason:
                    "Bauprojekt nicht gefunden"
            };
        }


        const order =
            new ConstructionMaterialOrder({

                construction,

                company:
                    this,

                proposal,

                transportSystem:
                    this.transportSystem
            });


        const reservation =
            order.reserveMaterials();


        if (
            !reservation.success
        ) {

            return {

                success:
                    false,

                reason:
                    reservation.reason,

                unavailable:
                    reservation.unavailable ??
                    [],

                order
            };
        }


        this.constructionMaterialOrders.push(
            order
        );


        return {

            success:
                true,

            order,

            reservation
        };
    }


    // ========================================
    // Materialbestellung suchen
    // ========================================

    getConstructionMaterialOrder(
        orderId
    ) {

        return (

            this.constructionMaterialOrders.find(

                order =>
                    order.id ===
                    orderId

            ) ?? null
        );
    }


    // ========================================
    // Transporte einer Bestellung planen
    // ========================================

    planConstructionMaterialTransport(
        orderId,
        truck = null
    ) {

        const order =
            this.getConstructionMaterialOrder(
                orderId
            );


        if (!order) {

            return {

                success:
                    false,

                reason:
                    "Materialbestellung nicht gefunden"
            };
        }


        return (
            order.createTransportJobs(
                truck
            )
        );
    }


    // ========================================
    // Echten Baustofftransport erzeugen
    //
    // Hier verbinden wir:
    //
    // MaterialOrder
    // + TransportJob
    // + echten Truck
    // ========================================

    createConstructionMaterialTransport({

        orderId,

        transportJobId,

        vehicleId,

        timingSettings = {}

    }) {

        const order =
            this.getConstructionMaterialOrder(
                orderId
            );


        if (!order) {

            return {

                success:
                    false,

                reason:
                    "Materialbestellung nicht gefunden"
            };
        }


        const transportJob =
            order.transportJobs.find(

                job =>
                    job.id ===
                    transportJobId
            );


        if (!transportJob) {

            return {

                success:
                    false,

                reason:
                    "Transportjob nicht gefunden"
            };
        }


        const truck =
            this.getVehicleById(
                vehicleId
            );


        if (!truck) {

            return {

                success:
                    false,

                reason:
                    "Fahrzeug nicht gefunden"
            };
        }


        // ========================================
        // LKW muss verfügbar sein
        // ========================================

        if (
            typeof truck.isAvailable ===
                "function" &&
            !truck.isAvailable()
        ) {

            return {

                success:
                    false,

                reason:
                    "Fahrzeug ist momentan nicht verfügbar"
            };
        }


        // ========================================
        // Prüfen, ob Job bereits einen Transport
        // besitzt
        // ========================================

        const existing =
            this.constructionMaterialTransports
                .find(

                    transport =>
                        transport.transportJob
                            ?.id ===
                        transportJobId

                    &&

                        transport.status !==
                        "failed"
                );


        if (existing) {

            return {

                success:
                    false,

                reason:
                    "Für diesen Transportjob existiert bereits ein Transport",

                transport:
                    existing
            };
        }


        // ========================================
        // Echten Transport erzeugen
        // ========================================

        const transport =
            new ConstructionMaterialTransport({

                materialOrder:
                    order,

                transportJob,

                truck,

                timingSettings
            });


        // ========================================
        // Vorprüfung
        // ========================================

        if (
            !transport.canTruckCarryJob()
        ) {

            return {

                success:
                    false,

                reason:
                    "Der ausgewählte LKW kann diese Ladung nicht transportieren"
            };
        }


        transportJob.truck =
            truck;


        transportJob.truckId =
            truck.id;


        transportJob.status =
            "assigned";


        this.constructionMaterialTransports
            .push(
                transport
            );


        return {

            success:
                true,

            transport
        };
    }


    // ========================================
    // Baustofftransport starten
    // ========================================

    startConstructionMaterialTransport(
        transportId,
        date = new Date()
    ) {

        const transport =
            this.getConstructionMaterialTransport(
                transportId
            );


        if (!transport) {

            return {

                success:
                    false,

                reason:
                    "Transport nicht gefunden"
            };
        }


        const started =
            transport.start(
                date
            );


        if (!started) {

            return {

                success:
                    false,

                reason:
                    transport.error ??
                    "Transport konnte nicht gestartet werden"
            };
        }


        return {

            success:
                true,

            transport
        };
    }


    // ========================================
    // Baustofftransport suchen
    // ========================================

    getConstructionMaterialTransport(
        transportId
    ) {

        return (

            this.constructionMaterialTransports
                .find(

                    transport =>
                        transport.id ===
                        transportId

                ) ?? null
        );
    }


    // ========================================
    // Transport entladen
    // ========================================

    unloadConstructionMaterialTransport(
        transportId,
        date = new Date()
    ) {

        const transport =
            this.getConstructionMaterialTransport(
                transportId
            );


        if (!transport) {

            return {

                success:
                    false,

                reason:
                    "Transport nicht gefunden"
            };
        }


        return (
            transport.unload(
                date
            )
        );
    }


    // ========================================
    // Aktive Baustofftransporte
    // ========================================

    getActiveConstructionMaterialTransports() {

        return this
            .constructionMaterialTransports
            .filter(

                transport =>

                    transport.status !==
                        "delivered"

                    &&

                    transport.status !==
                        "failed"
            );
    }


    // ========================================
    // Transport-Tick
    //
    // Später vom zentralen Spiel-Tick
    // aufrufen.
    // ========================================

    updateConstructionTransports(
        currentDate = new Date()
    ) {

        const arrived =
            [];


        for (
            const transport
            of this.constructionMaterialTransports
        ) {

            if (
                transport.status ===
                    "delivered" ||
                transport.status ===
                    "failed"
            ) {

                continue;
            }


            const oldStatus =
                transport.status;


            transport.update(
                currentDate
            );


            // ====================================
            // Neu angekommen
            // ====================================

            if (
                oldStatus !==
                    "arrived" &&
                transport.status ===
                    "arrived"
            ) {

                arrived.push(
                    transport
                );
            }
        }


        return {

            arrived
        };
    }


    // ========================================
    // Bauprojekte aktualisieren
    // ========================================

    updateConstructionProjects(
        days = 1
    ) {

        const results =
            [];


        for (
            const construction
            of this.constructionProjects
        ) {

            if (
                construction.status ===
                "finished"
            ) {

                continue;
            }


            const result =
                construction.update(
                    days
                );


            results.push({

                constructionId:
                    construction.id,

                result
            });
        }


        return results;
    }


    // ========================================
    // Aktive Bauprojekte
    // ========================================

    getActiveConstructionProjects() {

        return this.constructionProjects.filter(

            construction =>
                construction.status !==
                "finished"
        );
    }


    // ========================================
    // Offene Materialbestellungen
    // ========================================

    getOpenConstructionMaterialOrders() {

        return this
            .constructionMaterialOrders
            .filter(

                order =>

                    order.status !==
                        "delivered"

                    &&

                    order.status !==
                        "cancelled"

                    &&

                    order.status !==
                        "failed"
            );
    }


    // ========================================
    // Monatliche Kosten
    // ========================================

    calculateMonthlyCosts() {

        this.monthlyCosts.total =

            (
                this.monthlyCosts.employees ??
                0
            )

            +

            (
                this.monthlyCosts.electricity ??
                0
            )

            +

            (
                this.monthlyCosts.water ??
                0
            )

            +

            (
                this.monthlyCosts.maintenance ??
                0
            )

            +

            (
                this.monthlyCosts.insurance ??
                0
            )

            +

            (
                this.monthlyCosts.rent ??
                0
            )

            +

            (
                this.monthlyCosts.other ??
                0
            );


        return (
            this.monthlyCosts.total
        );
    }


    // ========================================
    // Firmenübersicht
    // ========================================

    getInfo() {

        return {

            name:
                this.name,

            industry:
                this.industry,

            type:
                this.type,

            money:
                this.money,

            coins:
                this.coins,

            land:
                this.land,

            buildings:
                this.buildings.length,

            vehicles:
                this.vehicles.length,

            availableVehicles:
                this.getAvailableVehicles()
                    .length,

            constructionProjects:
                this.constructionProjects
                    .length,

            activeConstructionProjects:
                this.getActiveConstructionProjects()
                    .length,

            openMaterialOrders:
                this.getOpenConstructionMaterialOrders()
                    .length,

            activeConstructionTransports:
                this.getActiveConstructionMaterialTransports()
                    .length,

            monthlyCosts:
                this.calculateMonthlyCosts()
        };
    }
}