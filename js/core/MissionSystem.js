// WorldProject - Aufgaben/Missionen mit Teillieferungen und skalierter Schwierigkeit
export class MissionSystem {
    ensureCompany(company) {
        company.missions ??= [];
        company.completedMissions ??= [];
        company.coins ??= 0;
        company.money ??= 0;
        return company;
    }

    estimateCompanyScale(company) {
        const vehicles = Array.isArray(company?.vehicles) ? company.vehicles.length : 0;
        const productionCapacity = Number(company?.production?.capacity) || 0;
        const money = Number(company?.money) || 0;
        const score = vehicles * 2 + productionCapacity / 1000 + money / 50000;
        if (score < 3) return "small";
        if (score < 10) return "medium";
        return "large";
    }

    createDeliveryMission(company, options = {}) {
        this.ensureCompany(company);
        const scale = this.estimateCompanyScale(company);
        const defaults = scale === "small"
            ? { targetAmount:1500, money:250, coins:0, boosterMinutes:20 }
            : scale === "medium"
                ? { targetAmount:15000, money:700, coins:1, boosterMinutes:45 }
                : { targetAmount:75000, money:1800, coins:2, boosterMinutes:60 };

        const mission = {
            id: Date.now() + Math.random(),
            type: "delivery",
            title: options.title ?? "Lieferauftrag",
            productId: options.productId ?? "lager033_bottle",
            productName: options.productName ?? "Lagerbier 0,33 l",
            targetAmount: Math.max(Number(options.targetAmount ?? defaults.targetAmount) || 0, 1),
            deliveredAmount: 0,
            status: "active",
            createdAt: new Date(),
            reward: {
                money: Number(options.moneyReward ?? defaults.money) || 0,
                coins: Number(options.coinReward ?? defaults.coins) || 0,
                boosterMinutes: Number(options.boosterMinutes ?? defaults.boosterMinutes) || 0
            },
            companyScale: scale
        };
        company.missions.push(mission);
        return mission;
    }

    getActiveMission(company) {
        this.ensureCompany(company);
        return company.missions.find(m => m.status === "active") ?? null;
    }

    deliver(company, missionId, amount) {
        this.ensureCompany(company);
        const mission = company.missions.find(m => m.id === missionId);
        if (!mission || mission.status !== "active") return { success:false, reason:"Aufgabe nicht aktiv" };
        const remaining = Math.max(mission.targetAmount - mission.deliveredAmount, 0);
        const accepted = Math.min(Math.max(Number(amount) || 0, 0), remaining);
        if (accepted <= 0) return { success:false, reason:"Keine lieferbare Menge" };
        mission.deliveredAmount += accepted;
        mission.progressPercent = mission.deliveredAmount / mission.targetAmount * 100;

        if (mission.deliveredAmount >= mission.targetAmount) {
            mission.status = "completed";
            mission.completedAt = new Date();
            company.money += mission.reward.money;
            company.coins += mission.reward.coins;
            company.activeBoosterMinutes = (Number(company.activeBoosterMinutes) || 0) + mission.reward.boosterMinutes;
            company.completedMissions.push(mission);
        }
        return { success:true, accepted, mission, completed:mission.status === "completed" };
    }

    createNextMission(company) {
        const current = this.getActiveMission(company);
        if (current) return current;
        const completed = this.ensureCompany(company).completedMissions.length;
        const factor = 1 + Math.min(completed * 0.08, 1.5);
        const base = this.createDeliveryMission(company);
        base.targetAmount = Math.round(base.targetAmount * factor);
        base.reward.money = Math.round(base.reward.money * (1 + Math.min(completed * 0.04, 0.75)));
        return base;
    }
}

export function runMissionSystemTest() {
    const company = { money:50000, coins:0, vehicles:[{}], production:{capacity:1000} };
    const system = new MissionSystem();
    const mission = system.createDeliveryMission(company,{targetAmount:15000,moneyReward:300,coinReward:1,boosterMinutes:60});
    const first = system.deliver(company,mission.id,500);
    const second = system.deliver(company,mission.id,14500);
    const success = first.success && mission.deliveredAmount === 15000 && second.completed && company.coins === 1 && company.money === 50300;
    console[success ? "log" : "error"](
        success ? "✅ MISSIONS-TEST ERFOLGREICH" : "❌ MISSIONS-TEST FEHLGESCHLAGEN",
        { mission, company }
    );
    return { success, mission };
}
