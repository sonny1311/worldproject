-- WorldProject / ORVUNO
-- 015_users_column_update_hardening.sql
--
-- Sicherheits-Härtung für public.users:
-- Ein normal authentifizierter Spieler darf nur ungefährliche Profil-/Consent-Felder
-- seines eigenen Datensatzes aktualisieren. Kritische Felder wie admin_role,
-- premium_*, status, auth_user_id, locked_until, password_hash usw. dürfen nicht
-- direkt über PostgREST PATCH veränderbar sein.
--
-- Die bestehende RLS-Policy users_update_own begrenzt weiterhin auf die eigene Zeile.
-- Admin-/Premium-/Statusänderungen müssen über dafür vorgesehene serverseitige RPCs laufen.

revoke update on table public.users from authenticated;

grant update (
    country_code,
    display_name,
    language_code,
    last_seen_at,
    privacy_accepted_at,
    privacy_version,
    profile_image_url,
    terms_accepted_at,
    terms_version
) on table public.users to authenticated;

-- Explizite Dokumentation der besonders kritischen Felder:
-- KEIN UPDATE-Recht für authenticated auf:
-- admin_role, premium_plan, premium_until, premium_auto_renew,
-- status, auth_user_id, public_id, id, email, password_hash,
-- failed_login_count, locked_until, deleted_at, created_at, last_login_at.
