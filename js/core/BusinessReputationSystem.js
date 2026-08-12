// WorldProject - Firmenruf, Lieferzuverlaessigkeit und Reklamationen
export class BusinessReputationSystem{
 constructor(){this.records=new Map();this.complaints=[];this.seq=1;}
 record(companyId){if(!this.records.has(companyId))this.records.set(companyId,{companyId,deliveries:0,onTime:0,qualityTotal:0,qualityCount:0,complaints:0,reputation:50});return this.records.get(companyId);}
 delivery(companyId,{onTime=true,quality=1}={}){const r=this.record(companyId);r.deliveries++;if(onTime)r.onTime++;r.qualityTotal+=Number(quality);r.qualityCount++;return this.recalculate(companyId);}
 complaint({companyId,customerCompanyId=null,product,reason,quality=null,createdAt=Date.now()}={}){const r=this.record(companyId),c={id:this.seq++,companyId,customerCompanyId,product,reason,quality,createdAt,status:"open"};this.complaints.push(c);r.complaints++;this.recalculate(companyId);return c;}
 resolve(id,resolution="resolved"){const c=this.complaints.find(x=>x.id===id);if(!c)return false;c.status=resolution;return true;}
 recalculate(companyId){const r=this.record(companyId),reliability=r.deliveries?r.onTime/r.deliveries:1,quality=r.qualityCount?r.qualityTotal/r.qualityCount:1,complaintPenalty=Math.min(.35,r.complaints/Math.max(5,r.deliveries)*.2);r.deliveryReliability=reliability;r.averageQuality=quality;r.reputation=Math.max(0,Math.min(100,Math.round((reliability*.45+Math.min(1.2,quality)/1.2*.45+.10-complaintPenalty)*100)));return r;}
 publicProfile(companyId){const r=this.recalculate(companyId);return{reputation:r.reputation,deliveryReliability:r.deliveryReliability,averageQuality:r.averageQuality,completedDeliveries:r.deliveries,complaints:r.complaints};}
}
export function runBusinessReputationTest(){const s=new BusinessReputationSystem();s.delivery(1,{onTime:true,quality:1.1});s.delivery(1,{onTime:false,quality:.8});const before=s.publicProfile(1).reputation;s.complaint({companyId:1,product:"beer",reason:"Qualitaet mangelhaft"});if(s.publicProfile(1).reputation>=before)throw new Error("Reklamation beeinflusst Firmenruf nicht");console.log("⭐ FIRMENRUF/LIEFERTREUE/REKLAMATIONEN ERFOLGREICH");return true;}
