-- WorldProject / ORVUNO
-- 016_restrict_anonymous_security_definer_rpcs.sql
--
-- SECURITY DEFINER RPCs dürfen nicht über die anonyme Supabase-Rolle erreichbar sein.
-- Eingeloggte Spieler erhalten nur den technischen EXECUTE-Zugriff; die Funktionen
-- selbst prüfen zusätzlich Eigentum bzw. Adminrolle serverseitig.

revoke execute on function public.admin_adjust_user_coins(bigint,bigint,text) from public;
revoke execute on function public.admin_rename_company(bigint,text,text) from public;
revoke execute on function public.admin_set_admin_role(bigint,text,text) from public;
revoke execute on function public.admin_set_company_money(bigint,numeric,text) from public;
revoke execute on function public.admin_set_user_premium(bigint,boolean,timestamp with time zone,text) from public;
revoke execute on function public.admin_set_user_status(bigint,text,text) from public;
revoke execute on function public.admin_unlock_user(bigint,text) from public;
revoke execute on function public.get_player_messages(integer) from public;
revoke execute on function public.mark_player_message_read(bigint) from public;
revoke execute on function public.send_player_message(text,text,text) from public;
revoke execute on function public.take_expansion_loan(bigint,numeric,numeric,integer,numeric) from public;
revoke execute on function public.transfer_business_money(bigint,bigint,numeric) from public;

grant execute on function public.admin_adjust_user_coins(bigint,bigint,text) to authenticated;
grant execute on function public.admin_rename_company(bigint,text,text) to authenticated;
grant execute on function public.admin_set_admin_role(bigint,text,text) to authenticated;
grant execute on function public.admin_set_company_money(bigint,numeric,text) to authenticated;
grant execute on function public.admin_set_user_premium(bigint,boolean,timestamp with time zone,text) to authenticated;
grant execute on function public.admin_set_user_status(bigint,text,text) to authenticated;
grant execute on function public.admin_unlock_user(bigint,text) to authenticated;
grant execute on function public.get_player_messages(integer) to authenticated;
grant execute on function public.mark_player_message_read(bigint) to authenticated;
grant execute on function public.send_player_message(text,text,text) to authenticated;
grant execute on function public.take_expansion_loan(bigint,numeric,numeric,integer,numeric) to authenticated;
grant execute on function public.transfer_business_money(bigint,bigint,numeric) to authenticated;
