-- Fase M3: tablas para Deuda Valen (prestamos personales con saldo propio) y Tareas.

create table public.personal_loans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lender_name text not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personal_loans enable row level security;

create policy personal_loans_all on public.personal_loans
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- Vincula un desembolso (other_income.type='loan') o un pago (expenses.type='personal')
-- a la deuda especifica a la que pertenece, para poder calcular el saldo restante.
alter table public.other_income
  add column loan_id uuid references public.personal_loans(id) on delete set null;

alter table public.expenses
  add column loan_id uuid references public.personal_loans(id) on delete set null;

create view public.v_personal_loan_balances as
select
  pl.id as loan_id,
  pl.organization_id,
  pl.lender_name,
  pl.status,
  coalesce(borrowed.total, 0) as total_borrowed,
  coalesce(paid.total, 0) as total_paid,
  coalesce(borrowed.total, 0) - coalesce(paid.total, 0) as balance
from public.personal_loans pl
left join (
  select loan_id, sum(amount) as total
  from public.other_income
  where type = 'loan' and loan_id is not null
  group by loan_id
) borrowed on borrowed.loan_id = pl.id
left join (
  select loan_id, sum(amount) as total
  from public.expenses
  where type = 'personal' and loan_id is not null
  group by loan_id
) paid on paid.loan_id = pl.id;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy tasks_all on public.tasks
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));
