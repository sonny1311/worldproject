// WorldProject - Gilden-Grundsystem
export class GuildSystem {
    constructor(){ this.guilds=[]; }

    createGuild({owner,name,languageCode="de",countryCode=null}={}){
        const n=String(name||"").trim();
        if(!owner||n.length<3) return {success:false,reason:"Ungueltige Gilde"};
        if(owner.guildId) return {success:false,reason:"Spieler ist bereits in einer Gilde"};
        if(this.guilds.some(g=>g.name.toLowerCase()===n.toLowerCase())) return {success:false,reason:"Gildenname bereits vergeben"};
        const guild={id:`guild_${Date.now()}_${Math.random()}`,name:n,languageCode,countryCode,ownerId:owner.id,members:[{userId:owner.id,role:"owner",joinedAt:new Date()}],createdAt:new Date()};
        this.guilds.push(guild); owner.guildId=guild.id;
        return {success:true,guild};
    }

    joinGuild(user,guildId){
        const guild=this.guilds.find(g=>g.id===guildId);
        if(!guild||!user) return {success:false,reason:"Gilde nicht gefunden"};
        if(user.guildId) return {success:false,reason:"Spieler ist bereits in einer Gilde"};
        guild.members.push({userId:user.id,role:"member",joinedAt:new Date()}); user.guildId=guild.id;
        return {success:true,guild};
    }

    leaveGuild(user){
        if(!user?.guildId) return {success:false,reason:"Keine Gilde"};
        const guild=this.guilds.find(g=>g.id===user.guildId);
        if(!guild) { user.guildId=null; return {success:true}; }
        if(guild.ownerId===user.id) return {success:false,reason:"Gildenleiter muss Leitung uebertragen oder Gilde aufloesen"};
        guild.members=guild.members.filter(m=>m.userId!==user.id); user.guildId=null;
        return {success:true,guild};
    }
}

export function runGuildSystemTest(){
 const g=new GuildSystem(); const a={id:"a",guildId:null}; const b={id:"b",guildId:null};
 const c=g.createGuild({owner:a,name:"Testgilde",languageCode:"de",countryCode:"DE"});
 const j=c.success?g.joinGuild(b,c.guild.id):{};
 const success=c.success&&j.success&&c.guild.members.length===2&&b.guildId===c.guild.id;
 console[success?"log":"error"](success?"✅ GILDEN-TEST ERFOLGREICH":"❌ GILDEN-TEST FEHLGESCHLAGEN",{c,j});
 return {success};
}
