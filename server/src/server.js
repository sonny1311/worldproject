import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import argon2 from "argon2";
import crypto from "crypto";
import { query, withTransaction } from "./db.js";

dotenv.config();

const app=express();
const PORT=Number(process.env.PORT||3001);
const FRONTEND_ORIGIN=process.env.FRONTEND_ORIGIN||"http://127.0.0.1:5500";
const COOKIE_NAME="wp_session";
const SESSION_DAYS=7;
const TERMS_VERSION=process.env.TERMS_VERSION||"1.0";
const PRIVACY_VERSION=process.env.PRIVACY_VERSION||"1.0";
const DEV_TOKENS=process.env.NODE_ENV!=="production";

app.use(cors({origin:FRONTEND_ORIGIN,credentials:true}));
app.use(express.json({limit:"100kb"}));
app.use(cookieParser());

const normalizeEmail=v=>String(v||"").trim().toLowerCase();
const normalizeUsername=v=>String(v||"").trim();
const sha=value=>crypto.createHash("sha256").update(String(value||"")).digest("hex");
const randomToken=()=>crypto.randomBytes(32).toString("hex");
// Express does not trust proxy headers by default. Use req.ip so arbitrary
// X-Forwarded-For values cannot rotate the rate-limit identity.
const clientIp=req=>String(req.ip||req.socket.remoteAddress||"").trim();
const publicUser=row=>({id:row.public_id,username:row.username,email:row.email,status:row.status,countryCode:row.country_code,languageCode:row.language_code,emailVerified:!!row.email_verified_at,displayName:row.display_name||row.username,createdAt:row.created_at,lastLoginAt:row.last_login_at});

const attempts=new Map();
function rateLimit(key,max=12,windowMs=15*60*1000){
 const now=Date.now(); const hit=attempts.get(key)||{count:0,resetAt:now+windowMs};
 if(now>hit.resetAt){hit.count=0;hit.resetAt=now+windowMs;} hit.count++; attempts.set(key,hit); return hit.count<=max;
}

async function audit(userId,eventType,details={}){
 try{await query("INSERT INTO account_audit_log(user_id,event_type,details) VALUES($1,$2,$3::jsonb)",[userId||null,eventType,JSON.stringify(details)]);}catch{}
}

async function logLogin(userId,req,successful){
 const ipHash=sha(clientIp(req)); const deviceHash=sha(req.get("user-agent")||"");
 try{await query("INSERT INTO login_events(user_id,ip_hash,device_hash,successful) VALUES($1,$2,$3,$4)",[userId||null,ipHash,deviceHash,successful]);}catch{}
}

function validateRegistration(data={}){
 const errors=[]; const username=normalizeUsername(data.username); const email=normalizeEmail(data.email); const password=String(data.password||"");
 if(username.length<3||username.length>40)errors.push("Benutzername muss 3 bis 40 Zeichen haben");
 if(!/^[A-Za-z0-9_.-]+$/.test(username))errors.push("Benutzername enthält ungültige Zeichen");
 if(!/^\S+@\S+\.\S+$/.test(email))errors.push("E-Mail-Adresse ist ungültig");
 if(password.length<10)errors.push("Passwort muss mindestens 10 Zeichen haben");
 if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))errors.push("Passwort muss Buchstaben und Zahlen enthalten");
 if(!data.termsAccepted)errors.push("AGB müssen akzeptiert werden");
 if(!data.privacyAccepted)errors.push("Datenschutz muss akzeptiert werden");
 return{success:errors.length===0,errors,username,email,password};
}

async function createVerificationToken(client,userId){
 const raw=randomToken(); const hash=sha(raw);
 await client.query("DELETE FROM email_verification_tokens WHERE user_id=$1 AND used_at IS NULL",[userId]);
 await client.query("INSERT INTO email_verification_tokens(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '24 hours')",[userId,hash]);
 return raw;
}

async function createSession(res,req,userId){
 const raw=randomToken(); const id=crypto.randomUUID(); const tokenHash=sha(raw);
 await query("INSERT INTO auth_sessions(id,user_id,token_hash,ip_hash,user_agent_hash,expires_at) VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '7 days')",[id,userId,tokenHash,sha(clientIp(req)),sha(req.get("user-agent")||"")]);
 res.cookie(COOKIE_NAME,raw,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:SESSION_DAYS*86400000});
 return id;
}

async function sessionUser(req){
 const raw=req.cookies[COOKIE_NAME]; if(!raw)return null;
 const found=await query(`SELECT u.*,s.id AS session_id FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>NOW() AND u.deleted_at IS NULL LIMIT 1`,[sha(raw)]);
 const user=found.rows[0];
 if(user){await query("UPDATE auth_sessions SET last_seen_at=NOW() WHERE id=$1",[user.session_id]); await query("UPDATE users SET last_seen_at=NOW() WHERE id=$1",[user.id]);}
 return user||null;
}

async function requireAuth(req,res,next){
 try{const user=await sessionUser(req); if(!user)return res.status(401).json({success:false,error:"Nicht angemeldet"}); if(user.status!=="active")return res.status(403).json({success:false,error:`Accountstatus: ${user.status}`}); req.user=user; next();}
 catch{res.status(401).json({success:false,error:"Session ungültig"});}
}

app.get("/api/health",async(_req,res)=>{try{await query("SELECT 1");res.json({success:true,service:"worldproject-api",database:true});}catch{res.status(503).json({success:false,error:"Datenbank nicht erreichbar"});}});

app.post("/api/auth/register",async(req,res)=>{
 if(!rateLimit(`register:${clientIp(req)}`,5,60*60*1000))return res.status(429).json({success:false,error:"Zu viele Registrierungsversuche"});
 const check=validateRegistration(req.body); if(!check.success)return res.status(400).json({success:false,errors:check.errors,error:check.errors.join("; ")});
 try{
  const passwordHash=await argon2.hash(check.password,{type:argon2.argon2id}); const publicId=crypto.randomUUID(); const now=new Date();
  const result=await withTransaction(async client=>{
   const existing=await client.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($2) LIMIT 1",[check.email,check.username]);
   if(existing.rowCount){const e=new Error("Benutzername oder E-Mail bereits vergeben");e.statusCode=409;throw e;}
   const inserted=await client.query(`INSERT INTO users(public_id,username,email,password_hash,status,country_code,language_code,terms_accepted_at,privacy_accepted_at,terms_version,privacy_version) VALUES($1,$2,$3,$4,'verification_pending',$5,$6,$7,$8,$9,$10) RETURNING *`,[publicId,check.username,check.email,passwordHash,req.body.countryCode||"DE",req.body.languageCode||"de",now,now,TERMS_VERSION,PRIVACY_VERSION]);
   await client.query("INSERT INTO coin_wallets(user_id,balance) VALUES($1,0)",[inserted.rows[0].id]);
   const verificationToken=await createVerificationToken(client,inserted.rows[0].id);
   return{row:inserted.rows[0],verificationToken};
  });
  await audit(result.row.id,"account_registered",{countryCode:req.body.countryCode||"DE"});
  res.status(201).json({success:true,user:publicUser(result.row),emailVerificationRequired:true,...(DEV_TOKENS?{devVerificationToken:result.verificationToken}:{})});
 }catch(error){res.status(error.statusCode||500).json({success:false,error:error.statusCode?error.message:"Registrierung fehlgeschlagen"});}
});

app.post("/api/auth/verify-email",async(req,res)=>{
 const token=String(req.body.token||""); if(!token)return res.status(400).json({success:false,error:"Verifizierungscode fehlt"});
 try{
  const found=await query(`SELECT t.id,t.user_id FROM email_verification_tokens t WHERE t.token_hash=$1 AND t.used_at IS NULL AND t.expires_at>NOW() LIMIT 1`,[sha(token)]);
  if(!found.rowCount)return res.status(400).json({success:false,error:"Verifizierungscode ungültig oder abgelaufen"});
  await withTransaction(async client=>{await client.query("UPDATE email_verification_tokens SET used_at=NOW() WHERE id=$1",[found.rows[0].id]);await client.query("UPDATE users SET email_verified_at=NOW(),status='active' WHERE id=$1",[found.rows[0].user_id]);});
  await audit(found.rows[0].user_id,"email_verified"); res.json({success:true});
 }catch{res.status(500).json({success:false,error:"E-Mail-Verifizierung fehlgeschlagen"});}
});

app.post("/api/auth/resend-verification",async(req,res)=>{
 const email=normalizeEmail(req.body.email); try{const found=await query("SELECT * FROM users WHERE email=$1 LIMIT 1",[email]); if(!found.rowCount||found.rows[0].email_verified_at)return res.json({success:true}); const raw=await withTransaction(c=>createVerificationToken(c,found.rows[0].id)); res.json({success:true,...(DEV_TOKENS?{devVerificationToken:raw}:{})});}catch{res.status(500).json({success:false,error:"Verifizierung konnte nicht angefordert werden"});}
});

app.post("/api/auth/login",async(req,res)=>{
 const key=String(req.body.emailOrUsername||"").trim(); const password=String(req.body.password||""); const limiter=`login:${clientIp(req)}:${key.toLowerCase()}`;
 if(!rateLimit(limiter,12))return res.status(429).json({success:false,error:"Zu viele Anmeldeversuche. Bitte später erneut versuchen."});
 if(!key||!password)return res.status(400).json({success:false,error:"Anmeldedaten fehlen"});
 try{
  const found=await query("SELECT * FROM users WHERE (LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($1)) AND deleted_at IS NULL LIMIT 1",[key]); const user=found.rows[0];
  if(!user){await logLogin(null,req,false);return res.status(401).json({success:false,error:"E-Mail/Benutzername oder Passwort falsch"});}
  if(user.locked_until&&new Date(user.locked_until)>new Date())return res.status(423).json({success:false,error:"Account vorübergehend wegen zu vieler Fehlversuche gesperrt"});
  const ok=await argon2.verify(user.password_hash,password);
  if(!ok){const count=(Number(user.failed_login_count)||0)+1; await query("UPDATE users SET failed_login_count=$2,locked_until=CASE WHEN $2>=5 THEN NOW()+INTERVAL '15 minutes' ELSE locked_until END WHERE id=$1",[user.id,count]); await logLogin(user.id,req,false); return res.status(401).json({success:false,error:"E-Mail/Benutzername oder Passwort falsch"});}
  if(!user.email_verified_at)return res.status(403).json({success:false,error:"Bitte zuerst die E-Mail-Adresse bestätigen"});
  if(user.status!=="active")return res.status(403).json({success:false,error:`Accountstatus: ${user.status}`});
  const updated=await query("UPDATE users SET last_login_at=NOW(),failed_login_count=0,locked_until=NULL WHERE id=$1 RETURNING *",[user.id]); await createSession(res,req,user.id); await logLogin(user.id,req,true); await audit(user.id,"login_success");
  res.json({success:true,user:publicUser(updated.rows[0])});
 }catch{res.status(500).json({success:false,error:"Anmeldung fehlgeschlagen"});}
});

app.post("/api/auth/logout",async(req,res)=>{try{const raw=req.cookies[COOKIE_NAME];if(raw)await query("UPDATE auth_sessions SET revoked_at=NOW() WHERE token_hash=$1",[sha(raw)]);}catch{} res.clearCookie(COOKIE_NAME);res.json({success:true});});
app.get("/api/auth/me",requireAuth,async(req,res)=>res.json({success:true,user:publicUser(req.user)}));

app.post("/api/auth/password-reset/request",async(req,res)=>{
 const email=normalizeEmail(req.body.email); try{const found=await query("SELECT id FROM users WHERE email=$1 AND deleted_at IS NULL LIMIT 1",[email]); if(!found.rowCount)return res.json({success:true}); const raw=randomToken(); await query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '1 hour')",[found.rows[0].id,sha(raw)]); res.json({success:true,...(DEV_TOKENS?{devResetToken:raw}:{})});}catch{res.status(500).json({success:false,error:"Passwort-Reset konnte nicht angefordert werden"});}
});

app.post("/api/auth/password-reset/confirm",async(req,res)=>{
 const token=String(req.body.token||""); const password=String(req.body.password||""); if(password.length<10)return res.status(400).json({success:false,error:"Passwort muss mindestens 10 Zeichen haben"});
 try{const found=await query("SELECT * FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW() LIMIT 1",[sha(token)]); if(!found.rowCount)return res.status(400).json({success:false,error:"Reset-Code ungültig oder abgelaufen"}); const hash=await argon2.hash(password,{type:argon2.argon2id}); await withTransaction(async c=>{await c.query("UPDATE users SET password_hash=$2,failed_login_count=0,locked_until=NULL WHERE id=$1",[found.rows[0].user_id,hash]);await c.query("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1",[found.rows[0].id]);await c.query("UPDATE auth_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL",[found.rows[0].user_id]);}); await audit(found.rows[0].user_id,"password_reset"); res.json({success:true});}catch{res.status(500).json({success:false,error:"Passwort konnte nicht geändert werden"});}
});

app.get("/api/account/overview",requireAuth,async(req,res)=>{
 try{
  const wallet=await query("SELECT balance,updated_at FROM coin_wallets WHERE user_id=$1",[req.user.id]);
  const tx=await query("SELECT amount,transaction_type,note,created_at FROM coin_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",[req.user.id]);
  const company=await query("SELECT id,name,industry,company_type,money,created_at FROM companies WHERE user_id=$1 LIMIT 1",[req.user.id]);
  res.json({success:true,user:publicUser(req.user),wallet:{balance:Number(wallet.rows[0]?.balance||0),updatedAt:wallet.rows[0]?.updated_at||null,transactions:tx.rows.map(r=>({amount:Number(r.amount),type:r.transaction_type,note:r.note,createdAt:r.created_at}))},company:company.rows[0]||null});
 }catch{res.status(500).json({success:false,error:"Accountübersicht konnte nicht geladen werden"});}
});

app.patch("/api/account/profile",requireAuth,async(req,res)=>{
 const displayName=String(req.body.displayName||req.user.username).trim().slice(0,80); const countryCode=String(req.body.countryCode||req.user.country_code||"DE").trim().slice(0,2).toUpperCase(); const languageCode=String(req.body.languageCode||req.user.language_code||"de").trim().slice(0,10);
 const updated=await query("UPDATE users SET display_name=$2,country_code=$3,language_code=$4 WHERE id=$1 RETURNING *",[req.user.id,displayName,countryCode,languageCode]); await audit(req.user.id,"profile_updated"); res.json({success:true,user:publicUser(updated.rows[0])});
});

app.post("/api/account/company",requireAuth,async(req,res)=>{
 try{
  const existing=await query("SELECT * FROM companies WHERE user_id=$1 LIMIT 1",[req.user.id]);
  if(existing.rowCount)return res.json({success:true,company:existing.rows[0],created:false});
  const name=String(req.body.name||`${req.user.username} GmbH`).trim().slice(0,120)||`${req.user.username} GmbH`;
  const industry=String(req.body.industry||"Getränke").trim().slice(0,80);
  const companyType=String(req.body.companyType||"Brauerei").trim().slice(0,80);
  const inserted=await query("INSERT INTO companies(user_id,name,industry,company_type,money) VALUES($1,$2,$3,$4,50000) RETURNING *",[req.user.id,name,industry,companyType]);
  await audit(req.user.id,"company_created",{companyId:inserted.rows[0].id,name});
  res.status(201).json({success:true,company:inserted.rows[0],created:true});
 }catch{res.status(500).json({success:false,error:"Unternehmen konnte nicht mit dem Account verbunden werden"});}
});

app.post("/api/account/delete-request",requireAuth,async(req,res)=>{await query("INSERT INTO account_deletion_requests(user_id,execute_after) VALUES($1,NOW()+INTERVAL '14 days')",[req.user.id]);await audit(req.user.id,"deletion_requested");res.json({success:true,executeAfterDays:14});});
app.post("/api/account/delete-request/cancel",requireAuth,async(req,res)=>{await query("UPDATE account_deletion_requests SET status='cancelled',cancelled_at=NOW() WHERE user_id=$1 AND status='requested'",[req.user.id]);await audit(req.user.id,"deletion_cancelled");res.json({success:true});});

app.use((error,_req,res,_next)=>{console.error(error);res.status(500).json({success:false,error:"Interner Serverfehler"});});
app.listen(PORT,()=>console.log(`WorldProject API läuft auf Port ${PORT}`));
