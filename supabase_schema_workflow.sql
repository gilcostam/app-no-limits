-- App No Limits: schema Workflow de Clientes (extensão)
-- Adicionar este script ao mesmo projeto que o supabase_schema.sql
-- Cole em: Supabase > SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem quebrar.

-- ============================================================
-- WORKFLOW DE CLIENTES: TABELA PRINCIPAL
-- ============================================================

create table if not exists cliente_workflow (
  id text primary key,
  cliente_id text references clientes(id) on delete cascade,
  cliente_nome text not null,

  -- Etapa atual (13 estágios)
  estagio_atual text not null default '01_contrato_enviado',
  data_estagio timestamptz default now(),

  -- Etapa 1: Contrato Enviado
  estagio_01_contrato_enviado_data timestamptz,
  estagio_01_contrato_enviado_status text default 'pendente',

  -- Etapa 2: Contrato Assinado
  estagio_02_contrato_assinado_data timestamptz,
  estagio_02_contrato_assinado_status text default 'pendente',

  -- Etapa 3: Cobrança no Asaas
  estagio_03_cobranca_asaas_data timestamptz,
  estagio_03_cobranca_asaas_status text default 'pendente',
  estagio_03_cobranca_asaas_id text,

  -- Etapa 4: Criação do Grupo
  estagio_04_criacao_grupo_data timestamptz,
  estagio_04_criacao_grupo_status text default 'pendente',
  estagio_04_criacao_grupo_url text,

  -- Etapa 5: Briefing Preenchido
  estagio_05_briefing_preenchido_data timestamptz,
  estagio_05_briefing_preenchido_status text default 'pendente',

  -- Etapa 6: Acesso ao Perfil do Google
  estagio_06_acesso_google_data timestamptz,
  estagio_06_acesso_google_status text default 'pendente',

  -- Etapa 7: Envio de Mídia para Aprovação
  estagio_07_midia_aprovacao_data timestamptz,
  estagio_07_midia_aprovacao_status text default 'pendente',

  -- Etapa 8: Criação do Site
  estagio_08_criacao_site_data timestamptz,
  estagio_08_criacao_site_status text default 'pendente',
  estagio_08_criacao_site_url text,

  -- Etapa 9: Aprovação do Site
  estagio_09_aprovacao_site_data timestamptz,
  estagio_09_aprovacao_site_status text default 'pendente',

  -- Etapa 10: Cadastro de Produtos e Serviços
  estagio_10_cadastro_produtos_data timestamptz,
  estagio_10_cadastro_produtos_status text default 'pendente',
  estagio_10_cadastro_produtos_total integer default 0,

  -- Etapa 11: Rotina de Otimização do Perfil
  estagio_11_otimizacao_perfil_data timestamptz,
  estagio_11_otimizacao_perfil_status text default 'ativo',
  estagio_11_otimizacao_perfil_proxima_data date,

  -- Etapa 12: Rotina de Otimização do Site
  estagio_12_otimizacao_site_data timestamptz,
  estagio_12_otimizacao_site_status text default 'ativo',
  estagio_12_otimizacao_site_proxima_data date,

  -- Etapa 13: Próximos Passos
  estagio_13_proximos_passos_data timestamptz,
  estagio_13_proximos_passos_status text default 'pendente',

  -- Campos auxiliares
  asaas_cliente_id text,
  asaas_tipo_importacao text default 'manual',
  responsavel_id uuid references usuarios(id) on delete set null,
  observacoes text default '',

  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists cliente_workflow_cliente_idx on cliente_workflow (cliente_id);
create index if not exists cliente_workflow_estagio_idx on cliente_workflow (estagio_atual);
create index if not exists cliente_workflow_responsavel_idx on cliente_workflow (responsavel_id);
create index if not exists cliente_workflow_criado_idx on cliente_workflow (criado_em desc);

-- ============================================================
-- WORKFLOW: LOG DE ATIVIDADES (AUDITORIA)
-- ============================================================

create table if not exists workflow_atividades (
  id text primary key,
  workflow_id text references cliente_workflow(id) on delete cascade,

  estagio_anterior text,
  estagio_novo text not null,

  tipo_atividade text not null,
  descricao text,

  usuario_id uuid references usuarios(id) on delete set null,
  criado_em timestamptz default now()
);

create index if not exists workflow_atividades_workflow_idx on workflow_atividades (workflow_id);
create index if not exists workflow_atividades_criado_idx on workflow_atividades (criado_em desc);

-- ============================================================
-- WORKFLOW: TAREFAS PERIÓDICAS (OTIMIZAÇÕES RECORRENTES)
-- ============================================================

create table if not exists workflow_tarefas_periodicas (
  id text primary key,
  workflow_id text references cliente_workflow(id) on delete cascade,

  tipo_tarefa text not null,
  frequencia_dias integer not null default 30,

  data_proxima_execucao date not null,
  data_ultima_execucao date,
  status text default 'agendada',

  resultado_descricao text,
  criado_em timestamptz default now()
);

create index if not exists workflow_tarefas_workflow_idx on workflow_tarefas_periodicas (workflow_id);
create index if not exists workflow_tarefas_proxima_idx on workflow_tarefas_periodicas (data_proxima_execucao);

-- ============================================================
-- WORKFLOW: SINCRONIZAÇÃO COM ASAAS (WEBHOOK LOG)
-- ============================================================

create table if not exists asaas_sincronizacao (
  id text primary key,
  webhook_id text unique,
  cliente_id text references clientes(id) on delete set null,

  tipo_evento text not null,
  payload_evento jsonb,

  workflow_criado_id text references cliente_workflow(id) on delete set null,
  status_processamento text default 'sucesso',
  erro_mensagem text,

  criado_em timestamptz default now()
);

create index if not exists asaas_sincronizacao_cliente_idx on asaas_sincronizacao (cliente_id);
create index if not exists asaas_sincronizacao_criado_idx on asaas_sincronizacao (criado_em desc);

-- ============================================================
-- WORKFLOW: TEMPLATE BRIEFING (RESPOSTAS DO CLIENTE)
-- ============================================================

create table if not exists workflow_template_briefing (
  id text primary key,
  workflow_id text references cliente_workflow(id) on delete cascade,

  descricao_negocio text,
  publico_alvo text,
  principais_servicos text,
  diferencial_competitivo text,

  fotos_capa_url text,
  fotos_produtos_url text,
  fotos_status text default 'pendente',

  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists workflow_briefing_workflow_idx on workflow_template_briefing (workflow_id);

-- ============================================================
-- POLÍTICAS DE SEGURANÇA
-- ============================================================

alter table cliente_workflow enable row level security;
alter table workflow_atividades enable row level security;
alter table workflow_tarefas_periodicas enable row level security;
alter table asaas_sincronizacao enable row level security;
alter table workflow_template_briefing enable row level security;

-- Workflow não contém dados pessoais (só andamento), então staff pode acessar como GMN
drop policy if exists "workflow: acesso autenticado" on cliente_workflow;
create policy "workflow: acesso autenticado" on cliente_workflow
  for all to authenticated using (true) with check (true);

drop policy if exists "workflow_atividades: acesso autenticado" on workflow_atividades;
create policy "workflow_atividades: acesso autenticado" on workflow_atividades
  for all to authenticated using (true) with check (true);

drop policy if exists "workflow_tarefas: acesso autenticado" on workflow_tarefas_periodicas;
create policy "workflow_tarefas: acesso autenticado" on workflow_tarefas_periodicas
  for all to authenticated using (true) with check (true);

drop policy if exists "asaas_sincronizacao: admin only" on asaas_sincronizacao;
create policy "asaas_sincronizacao: admin only" on asaas_sincronizacao
  for all to authenticated using (e_admin()) with check (e_admin());

drop policy if exists "workflow_briefing: acesso autenticado" on workflow_template_briefing;
create policy "workflow_briefing: acesso autenticado" on workflow_template_briefing
  for all to authenticated using (true) with check (true);

-- Verificação: deve mostrar as tabelas recém criadas
select
  'cliente_workflow' as tabela,
  (select count(*) from cliente_workflow) as linhas
union all select
  'workflow_atividades',
  (select count(*) from workflow_atividades)
union all select
  'workflow_tarefas_periodicas',
  (select count(*) from workflow_tarefas_periodicas)
union all select
  'asaas_sincronizacao',
  (select count(*) from asaas_sincronizacao)
union all select
  'workflow_template_briefing',
  (select count(*) from workflow_template_briefing);
