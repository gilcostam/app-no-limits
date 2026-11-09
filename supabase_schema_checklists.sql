-- App No Limits: estado dos checklists (workflow, GMB, diretórios, site)
-- Cole em: Supabase > SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem quebrar.

-- ============================================================
-- UMA TABELA PARA OS QUATRO MÓDULOS
-- ============================================================
-- A chave reproduz exatamente a chave que o app já usava no
-- localStorage, então o dado migra sem conversão:
--
--   workflow_cus_000123              (permanente)
--   gmb_cus_000123_2026-S45          (semanal)
--   gmb_cus_000123_2026-M11          (mensal)
--   gmb_cus_000123_2026-T4           (trimestral)
--   dir_cus_000123                   (cadastros, permanente)
--   dir_cus_000123_2026-T4           (auditoria trimestral)
--   site_cus_000123                  (fundação, permanente)
--   site_cus_000123_2026-M11         (mensal)
--   site_cus_000123_2026-T4          (trimestral)
--
-- Por que jsonb e não coluna por etapa: a tabela cliente_workflow
-- antiga tem uma coluna para cada estágio, e por isso toda vez que
-- um item do checklist muda é preciso rodar um ALTER TABLE. Com
-- jsonb o app evolui sem migração de banco.

create table if not exists checklist_estado (
  chave text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id) on delete set null
);

-- Consultas do app sempre filtram por prefixo de módulo.
create index if not exists checklist_estado_chave_idx
  on checklist_estado (chave text_pattern_ops);

-- ============================================================
-- SEGURANÇA
-- ============================================================
-- Esta tabela guarda só andamento de tarefa, nenhum dado pessoal
-- de cliente. Segue o mesmo critério já adotado em cliente_workflow
-- e nas tabelas gmn_*: funcionário acessa, igual ao admin.
-- Os dados pessoais (CPF, RG, endereço) continuam em `clientes` e
-- `contratos`, que seguem restritos a e_admin().

alter table checklist_estado enable row level security;

drop policy if exists "checklist: acesso autenticado" on checklist_estado;
create policy "checklist: acesso autenticado" on checklist_estado
  for all to authenticated using (true) with check (true);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
select
  (select count(*) from checklist_estado) as linhas,
  (select count(*) from pg_policies
    where tablename = 'checklist_estado') as politicas;
