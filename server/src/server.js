import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query, withTransaction } from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500";
const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-me";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const normalizeEmail = value => String(value || "").trim().toLowerCase();
const normalizeUsername = value => String(value || "").trim();

function publicUser(row) {
    return {
        id: row.public_id,
        username: row.username,
        email: row.email,
        status: row.status,
        countryCode: row.country_code,
        languageCode: row.language_code,
        emailVerified: !!row.email_verified_at,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at
    };
}

function validateRegistration(data = {}) {
    const errors = [];
    const username = normalizeUsername(data.username);
    const email = normalizeEmail(data.email);
    const password = String(data.password || "");
    if (username.length < 3 || username.length > 40) errors.push("Benutzername muss 3 bis 40 Zeichen haben");
    if (!/^[A-Za-z0-9_.-]+$/.test(username)) errors.push("Benutzername enthält ungültige Zeichen");
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.push("E-Mail-Adresse ist ungültig");
    if (password.length < 10) errors.push("Passwort muss mindestens 10 Zeichen haben");
    if (!data.termsAccepted) errors.push("AGB müssen akzeptiert werden");
    if (!data.privacyAccepted) errors.push("Datenschutz muss akzeptiert werden");
    return { success: errors.length === 0, errors, username, email, password };
}

function setSession(res, userId) {
    const token = jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("wp_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

function getSessionUserId(req) {
    const token = req.cookies.wp_session;
    if (!token) return null;
    try { return Number(jwt.verify(token, JWT_SECRET).sub); }
    catch { return null; }
}

app.get("/api/health", async (_req, res) => {
    try {
        await query("SELECT 1 AS ok");
        res.json({ success: true, service: "worldproject-api", database: true });
    } catch (error) {
        res.status(503).json({ success: false, error: "Datenbank nicht erreichbar" });
    }
});

app.post("/api/auth/register", async (req, res) => {
    const check = validateRegistration(req.body);
    if (!check.success) return res.status(400).json({ success: false, errors: check.errors, error: check.errors.join("; ") });

    try {
        const passwordHash = await argon2.hash(check.password, { type: argon2.argon2id });
        const publicId = crypto.randomUUID();
        const now = new Date();
        const result = await withTransaction(async client => {
            const existing = await client.query(
                "SELECT id FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($2) LIMIT 1",
                [check.email, check.username]
            );
            if (existing.rowCount) {
                const error = new Error("Benutzername oder E-Mail bereits vergeben");
                error.statusCode = 409;
                throw error;
            }

            const inserted = await client.query(
                `INSERT INTO users
                (public_id, username, email, password_hash, status, country_code, language_code, terms_accepted_at, privacy_accepted_at)
                VALUES ($1,$2,$3,$4,'verification_pending',$5,$6,$7,$8)
                RETURNING *`,
                [publicId, check.username, check.email, passwordHash, req.body.countryCode || "DE", req.body.languageCode || "de", now, now]
            );
            await client.query("INSERT INTO coin_wallets(user_id,balance) VALUES($1,0)", [inserted.rows[0].id]);
            return inserted.rows[0];
        });
        res.status(201).json({ success: true, user: publicUser(result), emailVerificationRequired: true });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, error: error.statusCode ? error.message : "Registrierung fehlgeschlagen" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const key = String(req.body.emailOrUsername || "").trim();
    const password = String(req.body.password || "");
    if (!key || !password) return res.status(400).json({ success: false, error: "Anmeldedaten fehlen" });

    try {
        const found = await query(
            "SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR LOWER(username)=LOWER($1) LIMIT 1",
            [key]
        );
        const user = found.rows[0];
        if (!user || !(await argon2.verify(user.password_hash, password))) {
            return res.status(401).json({ success: false, error: "E-Mail/Benutzername oder Passwort falsch" });
        }
        if (!["active", "verification_pending"].includes(user.status)) {
            return res.status(403).json({ success: false, error: `Accountstatus: ${user.status}` });
        }
        const updated = await query("UPDATE users SET last_login_at=NOW() WHERE id=$1 RETURNING *", [user.id]);
        setSession(res, user.id);
        res.json({ success: true, user: publicUser(updated.rows[0]) });
    } catch {
        res.status(500).json({ success: false, error: "Anmeldung fehlgeschlagen" });
    }
});

app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("wp_session");
    res.json({ success: true });
});

app.get("/api/auth/me", async (req, res) => {
    const id = getSessionUserId(req);
    if (!id) return res.status(401).json({ success: false, error: "Nicht angemeldet" });
    try {
        const found = await query("SELECT * FROM users WHERE id=$1 LIMIT 1", [id]);
        if (!found.rowCount) return res.status(401).json({ success: false, error: "Session ungültig" });
        res.json({ success: true, user: publicUser(found.rows[0]) });
    } catch {
        res.status(500).json({ success: false, error: "Account konnte nicht geladen werden" });
    }
});

app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, error: "Interner Serverfehler" });
});

app.listen(PORT, () => {
    console.log(`WorldProject API läuft auf Port ${PORT}`);
});
