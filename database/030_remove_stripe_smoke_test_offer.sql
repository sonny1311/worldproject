-- Der Live-Zahlungstest ist abgeschlossen. Das Testangebot bleibt aus
-- historischen Kaufdatensätzen nachvollziehbar, ist aber nicht mehr kaufbar.
UPDATE public.store_products
SET active = FALSE
WHERE sku = 'coins_50_smoke';
