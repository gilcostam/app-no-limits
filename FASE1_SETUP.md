# Fase 1: Setup do Schema de Workflow

## ✅ O que foi feito:

1. **SQL Schema** (`supabase_schema_workflow.sql`)
   - 5 tabelas: `cliente_workflow`, `workflow_atividades`, `workflow_tarefas_periodicas`, `asaas_sincronizacao`, `workflow_template_briefing`
   - Índices para performance
   - RLS policies (staff pode acessar, só admin pode ver sincronizações)

2. **UI** (`index.html`)
   - Aba "Workflow" adicionada (só admin vê)
   - Painel com lista de workflows
   - Modal para criar/editar workflows
   - Filtros por estágio, responsável e busca

3. **Lógica** (`workflow.js`)
   - CRUD básico de workflows
   - Renderização de lista com filtros
   - Modal para novo/editar workflow
   - Funções de carregamento e preenchimento de selects

4. **Integração** (`app.js`)
   - Carregamento de workflows ao iniciar app
   - Preenchimento de selects de clientes e responsáveis
   - Setup de eventos

---

## 🔧 Próximos passos:

### 1. Executar o schema no Supabase

1. Ir para: https://app.supabase.com
2. Projeto: `app-no-limits` (fmisqevbtyuynetakdhi)
3. Abrir **SQL Editor**
4. Clicar em **New query**
5. Copiar todo o conteúdo de `supabase_schema_workflow.sql`
6. Colar no editor
7. Clicar **Run** (ou Ctrl+Enter)

**Esperado:** Tabelas criadas com sucesso, sem erros.

### 2. Testar o app

1. Abrir: `https://seu-dominio/No-Limits/App No Limits/index.html` (ou local)
2. Fazer login com sua conta admin
3. Ir para aba **"Workflow"**
4. Clicar em **"+ Novo workflow"**
5. Selecionar um cliente
6. Atribuir responsável
7. Clicar **Salvar**

**Esperado:** Workflow criado, lista atualiza, sem erros.

---

## 📋 Checklist Fase 1:

- [ ] Schema SQL executado sem erros
- [ ] Aba "Workflow" visível para admin
- [ ] Botão "+ Novo workflow" funciona
- [ ] Modal abre e fecha corretamente
- [ ] Workflow criado e salvo no banco
- [ ] Lista de workflows renderiza com filtros
- [ ] Filtro por estágio funciona
- [ ] Filtro por responsável funciona
- [ ] Busca por nome de cliente funciona

---

## 🐛 Troubleshooting

**Erro: "cliente_workflow is not a table"**
- Schema não foi executado. Volte ao Supabase e rode o script.

**Erro: "RLS policy violation"**
- Verifique se você é admin no banco (`usuarios` tabela, papel='admin').

**Aba "Workflow" não aparece**
- Você não é admin? Só admin vê essa aba (classe `so-admin` no botão).

**Botão não faz nada ao clicar**
- Verifique se `workflow.js` está sendo carregado (F12 > Console, procure por erros).

---

## 📝 Notas

- MVP da Fase 1: CRUD básico, sem kanban board
- Próximas fases: transições de etapa, kanban visual, tarefas periódicas
- Dados salvam no Supabase se conectado, senão em localStorage

---

**Próxima revisão: após checklist Fase 1 passar**
