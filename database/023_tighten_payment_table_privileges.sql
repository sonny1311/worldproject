-- ORVUNO payment tables: authenticated players only need read access.
-- RLS does not protect TRUNCATE/TRIGGER/REFERENCES privileges, so remove them explicitly.

REVOKE ALL PRIVILEGES ON TABLE public.store_products FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.payment_purchases FROM anon, authenticated;
GRANT SELECT ON TABLE public.store_products TO authenticated;
GRANT SELECT ON TABLE public.payment_purchases TO authenticated;
