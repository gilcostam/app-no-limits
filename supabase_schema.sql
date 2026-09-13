-- App No Limits: schema Supabase (contratos + Google Meu Negócio)
-- Projeto: fmisqevbtyuynetakdhi (app-no-limits, org "No Limits App", plano Free)
-- Cole este script em: Supabase > SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem quebrar.
--
-- ATENÇÃO, LGPD: estas tabelas guardam dados pessoais de clientes (CPF, endereço,
-- e-mail, telefone). Diferente do painel da AGF, aqui NÃO é adequado liberar acesso
-- total ao papel "anon", porque a chave anônima fica visível no código publicado.
-- As políticas abaixo exigem usuário autenticado. Crie seu login em
-- Authentication > Users e ative o login por e-mail no painel do Supabase.
--
-- Há dois níveis de acesso: "admin" vê o app inteiro, "funcionario" vê só o GMN.
-- Contratos e clientes ficam restritos a admin, porque é onde estão CPF e RG.

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

-- ============================================================
-- EQUIPE
-- ============================================================

create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'funcionario',
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

-- SECURITY DEFINER de propósito: a função é consultada dentro das próprias
-- políticas de RLS, então precisa ler "usuarios" sem disparar RLS de novo.
create or replace function e_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios
    where id = auth.uid() and papel = 'admin' and ativo
  );
$$;

-- Todo login novo criado no painel já entra na equipe como funcionário.
-- Sem isto, cada funcionário novo exigiria um INSERT manual aqui no SQL.
create or replace function criar_usuario_no_cadastro()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into usuarios (id, nome)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function criar_usuario_no_cadastro();

-- Logins que já existiam antes do trigger.
insert into usuarios (id, nome)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- SEM ESTA LINHA VOCÊ PERDE O ACESSO AOS CONTRATOS: as políticas abaixo passam
-- a exigir papel admin, e o trigger cria todo mundo como funcionário.
update usuarios set papel = 'admin'
where id in (select id from auth.users where email = 'gilcostam@gmail.com');

-- ============================================================
-- GOOGLE MEU NEGÓCIO: ONBOARDING
-- ============================================================

-- cliente_nome fica repetido aqui de propósito: funcionário não enxerga a tabela
-- "clientes", então o nome precisa viver junto do onboarding para aparecer na tela.
create table if not exists gmn_onboarding (
  id text primary key,
  cliente_id text references clientes(id) on delete set null,
  cliente_nome text not null,
  responsavel_id uuid references usuarios(id) on delete set null,
  data_inicio date default current_date,
  etapa_fechado text not null default 'pendente',
  etapa_contrato text not null default 'pendente',
  etapa_briefing text not null default 'pendente',
  etapa_whatsapp text not null default 'pendente',
  etapa_drive text not null default 'pendente',
  etapa_capa text not null default 'pendente',
  etapa_produtos text not null default 'pendente',
  link_drive text default '',
  observacoes text default '',
  concluido_em timestamptz,
  criado_em timestamptz default now()
);

-- A tabela acima é "if not exists", então a etapa de foto de capa, que entrou
-- depois, não seria criada em quem já tinha a tabela. Daí este alter separado.
alter table gmn_onboarding add column if not exists etapa_capa text not null default 'pendente';

-- Cliente que saiu ou está pausado some das listas de trabalho sem perder o
-- histórico. É a coluna "Etapa Atual" da planilha reduzida ao que o app usa.
alter table gmn_onboarding add column if not exists ativo boolean not null default true;

create index if not exists gmn_onboarding_responsavel_idx on gmn_onboarding (responsavel_id);
create index if not exists gmn_onboarding_criado_idx on gmn_onboarding (criado_em desc);

-- ============================================================
-- GOOGLE MEU NEGÓCIO: CONTEÚDO SEMANAL
-- ============================================================

-- Uma linha por cliente, mês e semana, com as seis tarefas da aba "Conteúdo" da
-- planilha. Na planilha o mês vira uma aba duplicada; aqui o mês é só uma coluna,
-- então o histórico se acumula sozinho.
create table if not exists gmn_conteudo (
  id text primary key,
  onboarding_id text references gmn_onboarding(id) on delete cascade,
  mes text not null,
  semana integer not null,
  post text not null default 'pendente',
  foto text not null default 'pendente',
  qa text not null default 'pendente',
  avaliacoes text not null default 'pendente',
  horarios text not null default 'pendente',
  produtos text not null default 'pendente',
  criado_em timestamptz default now()
);

create index if not exists gmn_conteudo_mes_idx on gmn_conteudo (mes);

-- ============================================================
-- GOOGLE MEU NEGÓCIO: SEO E SITE
-- ============================================================

-- Uma linha por cliente, sem mês: é um estado que vai evoluindo, não trabalho que
-- se repete toda semana. Por isso o id é o próprio id do onboarding, que já serve
-- de chave e de vínculo ao mesmo tempo.
--
-- A planilha tem "Site Institucional" (✅/⏳/❌/N/A) e "Status do Site" (cinco
-- opções) lado a lado, contando a mesma história de dois jeitos, e a Policlínica
-- já estava com as duas se contradizendo. Aqui ficou só a coluna "site".
create table if not exists gmn_seo (
  id text primary key references gmn_onboarding(id) on delete cascade,
  palavras_chave text not null default 'pendente',
  diretorios text not null default 'pendente',
  avaliacoes text not null default 'pendente',
  conteudo_site text not null default 'pendente',
  redes text not null default 'pendente',
  youtube text not null default 'pendente',
  posicionamento text not null default 'pendente',
  site text not null default 'nao_iniciado',
  link_site text default '',
  criado_em timestamptz default now()
);

-- ============================================================
-- POLÍTICAS
-- ============================================================

alter table clientes enable row level security;
alter table contratos enable row level security;
alter table usuarios enable row level security;
alter table gmn_onboarding enable row level security;
alter table gmn_conteudo enable row level security;
alter table gmn_seo enable row level security;

drop policy if exists "acesso autenticado" on clientes;
drop policy if exists "clientes: somente admin" on clientes;
create policy "clientes: somente admin" on clientes
  for all to authenticated using (e_admin()) with check (e_admin());

drop policy if exists "acesso autenticado" on contratos;
drop policy if exists "contratos: somente admin" on contratos;
create policy "contratos: somente admin" on contratos
  for all to authenticated using (e_admin()) with check (e_admin());

-- Todo mundo lê a equipe, para montar a lista de responsáveis. Só admin altera.
drop policy if exists "usuarios: leitura autenticada" on usuarios;
create policy "usuarios: leitura autenticada" on usuarios
  for select to authenticated using (true);

drop policy if exists "usuarios: escrita admin" on usuarios;
create policy "usuarios: escrita admin" on usuarios
  for all to authenticated using (e_admin()) with check (e_admin());

-- Onboarding, conteúdo e SEO não guardam dado pessoal, só nome do cliente e o
-- andamento do trabalho, então o funcionário precisa e pode mexer nos três.
drop policy if exists "gmn: acesso autenticado" on gmn_onboarding;
create policy "gmn: acesso autenticado" on gmn_onboarding
  for all to authenticated using (true) with check (true);

drop policy if exists "gmn conteudo: acesso autenticado" on gmn_conteudo;
create policy "gmn conteudo: acesso autenticado" on gmn_conteudo
  for all to authenticated using (true) with check (true);

drop policy if exists "gmn seo: acesso autenticado" on gmn_seo;
create policy "gmn seo: acesso autenticado" on gmn_seo
  for all to authenticated using (true) with check (true);

-- Confira o resultado: você precisa aparecer como admin.
select nome, papel, ativo from usuarios order by papel, nome;
