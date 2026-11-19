# SymOS

Sistema de gestão de projetos da Symco, desenvolvido com React, TypeScript e Vite. A persistência pode usar Supabase ou o armazenamento local do navegador.

## Executar

```bash
npm ci
npm run dev
npm test
npm run build
```

Abra o endereço exibido pelo Vite. `/` apresenta a página inicial de contexto (KYC leve), com a configuração de um workspace vazio. As rotas de trabalho ficam sob `/app`; o primeiro acesso direto a elas também apresenta a configuração inicial.

## Organização

- `src/domain`: modelos tipados, catálogo de módulos e templates, dados iniciais e seletores derivados.
- `src/repositories`: contrato de persistência, com implementações para Supabase e `localStorage`.
- `src/application`: ações de criação/edição, atualização imediata e registro de atividade.
- `src/features`: telas de dashboard, portfólio, projeto, criação e governança.
- `src/components/os`: componentes reutilizados entre as telas.
- `src/styles/tokens.css`: cores semânticas, tipografia, tamanhos, elevação e tempos de movimento.
- `src/styles/components.css`: estilos dos controles compartilhados e regras de interação.
- `src/styles/{layout,workspace,modules,flows}.css`: composição e layouts das telas.

Cada projeto pertence a um workspace. As telas filtram pelo workspace ativo e calculam o progresso a partir das tarefas concluídas. Projetos novos começam em branco. As metodologias, módulos e modelos de projeto continuam disponíveis para escolha.

## Conectar o Supabase

1. Aplique a migração [`20261119180000_symos_account_data.sql`](supabase/migrations/20261119180000_symos_account_data.sql) ao projeto Supabase. Use o SQL Editor para executar o arquivo ou, em um projeto vinculado à CLI, use `supabase db push`.
2. No Supabase, em **Authentication → Users**, crie o usuário que vai entrar no SymOS com e-mail e senha.
3. Localmente, copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Use a URL do projeto e a chave pública que começa com `sb_publishable_`. No GitHub Pages, use os mesmos nomes em **Settings → Secrets and variables → Actions → Variables**.
4. Reinicie o Vite ou execute de novo o workflow **Deploy to GitHub Pages**. Entre no SymOS, configure o workspace e crie um primeiro projeto. Abra o app em outro navegador com a mesma conta para conferir a persistência.

O Supabase guarda um documento JSON por conta e usa políticas de acesso por linha (RLS) para isolar os dados de cada usuário. O número de revisão impede que uma sessão desatualizada sobrescreva um salvamento feito em outra sessão. Em caso de conflito, recarregue antes de repetir a edição.

Ao deixar as duas variáveis vazias, o SymOS inicia em modo local. Nesse modo, projetos da demonstração e registros associados deixam de aparecer. Projetos criados fora da demonstração continuam acessíveis. A chave anterior `symos-database-v1` fica preservada para recuperação, inclusive para quem adicionou conteúdo a um projeto de exemplo. O primeiro acesso ao Supabase começa vazio. Os dados locais não são enviados automaticamente.

## Design system

Use os componentes em `src/components/os` para botões, indicadores, status, seletores de visualização, grupos recolhíveis e gavetas. Use os tokens semânticos para aplicar a mesma cor, profundidade e espaçamento em contextos equivalentes.

Ao mudar a posição de um elemento persistente, anime a partir da posição que ele ocupava até o destino. Use mudança de largura e posição para indicadores, expansão de altura para regiões recolhíveis e deslocamento para gavetas. Reserve a escala para o retorno tátil dos controles e o desfoque para a separação de camadas flutuantes. A preferência de movimento reduzido desativa os deslocamentos animados.

Em **Configurações → Preferências**, tema, cor de destaque, tamanho do texto, contraste e movimento são salvos no navegador e valem para todos os workspaces. O CSS personalizado é aplicado quando salvo e pode ser desativado sem apagar o código. Se uma regra ocultar os controles, substitua o trecho após `#` no endereço por `/app/settings/preferences/safe` e desative ou corrija a regra.

## Fluxo disponível

Troque de workspace, crie um projeto com template ou etapas próprias, escolha membros, abra o projeto, crie e edite tarefas, mova tarefas entre colunas do Kanban, comente, registre documentos como metadados ou links, riscos e decisões. Dashboard, portfólio, busca e atividade refletem as alterações. A recarga conserva os dados na fonte de persistência configurada.

A página inicial coleta apenas nome, função e nome do workspace como campos obrigatórios. O perfil fica salvo no Supabase quando a conexão está ativa e no navegador em modo local. O tutorial guiado abre após a configuração e pode ser reaberto pelo botão **Tutorial** no topo. O ícone de bússola retorna à página inicial.

## Páginas e documentos

Governança reúne Qualidade, Aprovações, Riscos e Decisões do workspace. Qualidade abre por padrão e cada aba tem endereço próprio. Os endereços antigos continuam abrindo a aba correspondente. Automações e Relatórios têm fluxos próprios. Documentos oferece pastas, tabela agrupada, filtros, paginação, edição, links externos e arquivos de até 2 MB por arquivo. Cronograma exibe Gantt e lista de prazos. Configurações permite renomear o workspace, cadastrar clientes e ativar módulos. Projetos reúne cards, tabela e cronograma. Dentro de cada projeto, as abas são Resumo, Tarefas, Arquivos e Governança. Os endereços antigos de Portfólio e Cronograma abrem Projetos na visualização correspondente.

As rotas usam hash (`#/app/documents`, por exemplo) para suportar recarga no GitHub Pages. Consulte [o mapa de implementação e limites](docs/PROTOTYPE-ALIGNMENT.md).

## Limites desta fase

O acesso ao Supabase é individual por conta. Colaboração entre contas, permissões por papel e execução de automações no servidor dependem de implementação adicional. No Supabase, arquivos pequenos ficam no documento JSON junto dos demais dados. Preferências de interface continuam neste navegador.
