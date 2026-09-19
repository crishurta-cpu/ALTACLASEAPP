-- Datos de empresa mostrados en Configuracion y usados en reportes/facturas.
alter table public.organizations
  add column nit text,
  add column address text,
  add column city text;

-- Solo habia policy de SELECT: un miembro no podia editar los datos de su
-- propia organizacion (bloqueaba justamente este formulario nuevo).
create policy organizations_update on public.organizations
  for update
  using (is_org_member(id))
  with check (is_org_member(id));
