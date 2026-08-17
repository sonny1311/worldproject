-- A founded business may not switch industry/company type through direct REST column updates.
-- Keep the display name editable; industry identity changes must use an explicit server-controlled flow.

REVOKE UPDATE (industry, company_type) ON TABLE public.companies FROM authenticated;
GRANT UPDATE (name) ON TABLE public.companies TO authenticated;
