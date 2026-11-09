-- App No Limits: view de clientes para a equipe
-- Cole em: Supabase > SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem quebrar.

-- ============================================================
-- O PROBLEMA
-- ============================================================
-- A política "clientes: somente admin" usa e_admin(), então um
-- funcionário autenticado não lê nenhuma linha de `clientes`. Como as
-- rotinas de GMB, diretórios e site listam clientes na lateral, o
-- funcionário entra no app e vê quatro telas vazias.
--
-- Liberar `clientes` para autenticado resolveria a tela e quebraria a
-- LGPD: a tabela guarda documento, endereço e CEP.
--
-- A saída é expor só o que identifica o cliente.

-- ============================================================
-- A VIEW
-- ============================================================
drop view if exists clientes_equipe;

create view clientes_equipe
  with (security_invoker = false) as
  select id, nome
  from clientes;

-- security_invoker = false é deliberado, não esquecimento.
-- Com ele a view roda com a permissão do dono e ignora o RLS de
-- `clientes`, que é justamente o que precisamos: o funcionário
-- atravessa o e_admin() por esta porta estreita e só por ela.
-- Se virar `true`, a view passa a respeitar o RLS e volta a devolver
-- zero linha para funcionário, que é o bug que ela existe para corrigir.

-- Colunas de propósito fora: documento, endereco, cidade, uf, cep,
-- tipo_pessoa, telefone, email. Para marcar checklist, nome basta.
-- Se um dia a equipe precisar de telefone ou e-mail, acrescente aqui
-- e em nenhum outro lugar. É a única porta.

comment on view clientes_equipe is
  'Clientes sem dado pessoal, para funcionário marcar checklist. Dado sensível continua em clientes, restrito a e_admin().';

-- ============================================================
-- PERMISSÕES
-- ============================================================
-- O Supabase concede privilégio automático em objetos novos do schema
-- public para anon e authenticated, então revogar do anon não é
-- paranoia: sem esta linha a lista de clientes fica legível sem login.

revoke all on clientes_equipe from anon;
revoke all on clientes_equipe from public;
grant select on clientes_equipe to authenticated;

-- ATENÇÃO: a segurança desta view depende do cadastro estar fechado.
-- Com signup aberto, qualquer pessoa cria conta, vira `authenticated`
-- e lê a carteira de clientes inteira. Desligue em
-- Authentication > Sign In / Providers > Allow new users to sign up.

-- PostgREST guarda o schema em cache e não enxerga a view sem isto.
notify pgrst, 'reload schema';

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
select
  (select count(*) from clientes_equipe) as clientes_visiveis,
  (select count(*) from information_schema.role_table_grants
     where table_name = 'clientes_equipe' and grantee = 'anon') as vazamento_anon,
  (select count(*) from information_schema.role_table_grants
     where table_name = 'clientes_equipe' and grantee = 'authenticated') as acesso_equipe;
-- Esperado: vazamento_anon = 0 e acesso_equipe = 1
