-- App No Limits: schema Supabase (módulo de contratos)
-- Projeto: fmisqevbtyuynetakdhi (app-no-limits, org "No Limits App", plano Free)
-- Cole este script em: Supabase > SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem quebrar.
--
-- ATENÇÃO, LGPD: estas tabelas guardam dados pessoais de clientes (CPF, endereço,
-- e-mail, telefone). Diferente do painel da AGF, aqui NÃO é adequado liberar acesso
-- total ao papel "anon", porque a chave anônima fica visível no código publicado.
-- As políticas abaixo exigem usuário autenticado. Crie seu login em
-- Authentication > Users e ative o login por e-mail no painel do Supabase.

create table if not exists clientes (
  id text primary key,
  tipo_pessoa text not null default 'PF',
  sexo text default 'F',
  nome text not null,
  documento text default '',
  rg text default '',
  responsavel_legal text default '',
  endereco text default '',
  cidade text default '',
  uf text default '',
  cep text default '',
  email text default '',
  telefone text default '',
  criado_em timestamptz default now()
);

create table if not exists contratos (
  id text primary key,
  cliente_id text references clientes(id) on delete cascade,
  cliente_nome text not null,
  modelo text not null,
  plano_base text,
  valor_base numeric not null,
  addon_trafego boolean default false,
  valor_trafego numeric,
  addon_redes boolean default false,
  valor_redes numeric,
  valor_total numeric not null,
  dia_vencimento integer,
  primeiro_pagamento date,
  data_assinatura date,
  arquivo text,
  status text default 'gerado',
  autentique_id text,
  autentique_url text,
  assinado_em timestamptz,
  criado_em timestamptz default now()
);

create index if not exists contratos_cliente_idx on contratos (cliente_id);
create index if not exists contratos_criado_idx on contratos (criado_em desc);

alter table clientes enable row level security;
alter table contratos enable row level security;

drop policy if exists "acesso autenticado" on clientes;
create policy "acesso autenticado" on clientes
  for all to authenticated using (true) with check (true);

drop policy if exists "acesso autenticado" on contratos;
create policy "acesso autenticado" on contratos
  for all to authenticated using (true) with check (true);
