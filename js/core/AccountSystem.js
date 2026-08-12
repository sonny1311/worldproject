// WorldProject - Account-/Registrierungsprototyp
// WICHTIG: Browser-Prototyp. In Produktion muessen Registrierung,
// Passwort-Hashing, Sessions und E-Mail-Verifikation serverseitig laufen.

export class AccountSystem {
    constructor(){
        this.users=[];
        this.currentUser=null;
    }

    normalizeEmail(email){ return String(email||"").trim().toLowerCase(); }
    normalizeUsername(username){ return String(username||"").trim(); }

    validateRegistration({username,email,password,termsAccepted,privacyAccepted}={}){
        const errors=[];
        const u=this.normalizeUsername(username);
        const e=this.normalizeEmail(email);
        if(u.length<3) errors.push("Benutzername muss mindestens 3 Zeichen haben");
        if(!/^[A-Za-z0-9_.-]+$/.test(u)) errors.push("Benutzername enthaelt ungueltige Zeichen");
        if(!/^\S+@\S+\.\S+$/.test(e)) errors.push("E-Mail-Adresse ist ungueltig");
        if(String(password||"").length<10) errors.push("Passwort muss mindestens 10 Zeichen haben");
        if(!termsAccepted) errors.push("AGB muessen akzeptiert werden");
        if(!privacyAccepted) errors.push("Datenschutz muss akzeptiert werden");
        if(this.users.some(x=>x.username.toLowerCase()===u.toLowerCase())) errors.push("Benutzername bereits vergeben");
        if(this.users.some(x=>x.email===e)) errors.push("E-Mail bereits registriert");
        return {success:errors.length===0,errors};
    }

    register(data={}){
        const check=this.validateRegistration(data);
        if(!check.success) return check;
        const now=new Date();
        const user={
            id:`usr_${Date.now()}_${Math.floor(Math.random()*100000)}`,
            username:this.normalizeUsername(data.username),
            email:this.normalizeEmail(data.email),
            status:"verification_pending",
            countryCode:data.countryCode||"DE",
            languageCode:data.languageCode||"de",
            // Nur Testmarker - KEIN Passwort wird im Browser gespeichert.
            passwordConfigured:true,
            emailVerified:false,
            termsAcceptedAt:now,
            privacyAcceptedAt:now,
            createdAt:now,
            lastLoginAt:null,
            wallet:{balance:0,transactions:[]},
            householdDeclared:false,
            guildId:null
        };
        this.users.push(user);
        return {success:true,user};
    }

    verifyEmail(userId){
        const user=this.users.find(u=>u.id===userId);
        if(!user) return {success:false,reason:"Account nicht gefunden"};
        user.emailVerified=true;
        user.emailVerifiedAt=new Date();
        if(user.status==="verification_pending") user.status="active";
        return {success:true,user};
    }

    login({emailOrUsername}={}){
        const key=String(emailOrUsername||"").trim().toLowerCase();
        const user=this.users.find(u=>u.email===key || u.username.toLowerCase()===key);
        if(!user) return {success:false,reason:"Account nicht gefunden"};
        if(!["active","verification_pending"].includes(user.status)) return {success:false,reason:`Accountstatus: ${user.status}`};
        user.lastLoginAt=new Date();
        this.currentUser=user;
        return {success:true,user};
    }

    logout(){ const user=this.currentUser; this.currentUser=null; return {success:true,user}; }

    creditCoins(user,amount,type="earned",note=""){
        const n=Math.max(Math.floor(Number(amount)||0),0);
        if(!user||n<=0) return {success:false,reason:"Ungueltige Coin-Gutschrift"};
        user.wallet.balance+=n;
        const tx={id:`ctx_${Date.now()}_${Math.random()}`,amount:n,balanceAfter:user.wallet.balance,type,note,createdAt:new Date()};
        user.wallet.transactions.push(tx);
        return {success:true,transaction:tx,balance:user.wallet.balance};
    }

    debitCoins(user,amount,type="spent",note=""){
        const n=Math.max(Math.floor(Number(amount)||0),0);
        if(!user||n<=0||user.wallet.balance<n) return {success:false,reason:"Nicht genug Coins"};
        user.wallet.balance-=n;
        const tx={id:`ctx_${Date.now()}_${Math.random()}`,amount:-n,balanceAfter:user.wallet.balance,type,note,createdAt:new Date()};
        user.wallet.transactions.push(tx);
        return {success:true,transaction:tx,balance:user.wallet.balance};
    }
}

export function runAccountSystemTest(){
 const a=new AccountSystem();
 const r=a.register({username:"Testspieler",email:"test@example.com",password:"1234567890x",termsAccepted:true,privacyAccepted:true});
 const v=r.success?a.verifyEmail(r.user.id):{success:false};
 const c=r.success?a.creditCoins(r.user,100,"purchase","Testkauf"):{};
 const success=r.success&&v.success&&c.success&&r.user.status==="active"&&r.user.wallet.balance===100;
 console[success?"log":"error"](success?"✅ ACCOUNT-TEST ERFOLGREICH":"❌ ACCOUNT-TEST FEHLGESCHLAGEN",{r,v,c});
 return {success};
}
