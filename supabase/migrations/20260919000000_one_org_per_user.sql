-- Fase M5 (hotfix): ensureOrganization() tenia una condicion de carrera —
-- dos llamadas concurrentes al onAuthStateChange (INITIAL_SESSION + SIGNED_IN)
-- podian ambas ver "sin membresia todavia" y crear 2 organizaciones para el
-- mismo usuario. El modelo de producto es 1 organizacion por usuario, asi
-- que se refuerza con un UNIQUE constraint real (antes solo existia sobre
-- (organization_id, user_id), que no evitaba pertenecer a dos orgs distintas).
alter table public.organization_members
  add constraint organization_members_user_id_key unique (user_id);
