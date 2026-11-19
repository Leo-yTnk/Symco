# SymOS

Protótipo funcional de gestão de projetos da Symco. A aplicação usa React, TypeScript e Vite. Os dados são locais ao navegador nesta primeira fase.

## Executar

```bash
npm ci
npm run dev
npm test
npm run build
```

Abra o endereço exibido pelo Vite. `/` apresenta a página inicial de contexto (KYC leve), com opção de configuração ou exploração da demonstração. As rotas de trabalho ficam sob `/app`; o primeiro acesso direto a elas também apresenta a configuração inicial.

## Organização

- `src/domain`: modelos tipados, catálogo de módulos e templates, dados iniciais e seletores derivados.
- `src/repositories`: contrato de persistência e implementação `localStorage`.
- `src/application`: ações de criação/edição, atualização imediata e registro de atividade.
- `src/features`: telas de dashboard, portfólio, projeto, criação e governança.
- `src/components/os`: componentes reutilizados entre as telas.
- `src/styles/tokens.css`: cores semânticas, tipografia, tamanhos, elevação e tempos de movimento.
- `src/styles/components.css`: estilos dos controles compartilhados e regras de interação.
- `src/styles/{layout,workspace,modules,flows}.css`: composição e layouts das telas.

O banco local é semeado apenas na primeira visita (`symos-database-v1`). Cada projeto pertence a um workspace; os seletores e telas filtram os projetos pelo workspace ativo. O progresso é calculado a partir das tarefas concluídas. A metodologia e suas etapas são dados e podem ser escolhidas ou criadas no fluxo de novo projeto. Os serviços Symco ficam em um catálogo à parte do núcleo de projetos.

## Design system

Use os componentes em `src/components/os` para botões, indicadores, status, seletores de visualização, grupos recolhíveis e gavetas. Use os tokens semânticos para aplicar a mesma cor, profundidade e espaçamento em contextos equivalentes.

Ao mudar a posição de um elemento persistente, anime a partir da posição que ele ocupava até o destino. Use mudança de largura e posição para indicadores, expansão de altura para regiões recolhíveis e deslocamento para gavetas. Reserve a escala para o retorno tátil dos controles e o desfoque para a separação de camadas flutuantes. A preferência de movimento reduzido desativa os deslocamentos animados.

## Fluxo disponível

Troque de workspace, crie um projeto com template ou etapas próprias, escolha membros, abra o projeto, crie e edite tarefas, mova tarefas entre colunas do Kanban, comente, registre documentos como metadados ou links, riscos e decisões. Dashboard, portfólio, busca e atividade refletem as alterações. A recarga conserva os dados no mesmo navegador.

A página inicial coleta apenas nome, função e nome do workspace como campos obrigatórios. As respostas ficam no próprio navegador; não constituem verificação formal de identidade. O tutorial guiado abre após a configuração e pode ser reaberto pelo botão **Tutorial** no topo. O ícone de bússola retorna à página inicial.

## Páginas e documentos

As páginas Qualidade, Automações e Relatórios têm fluxos próprios. Documentos oferece pastas, tabela agrupada, filtros, paginação, edição, links externos e arquivos locais de até 2 MB por arquivo. Cronograma exibe Gantt e lista de prazos. Configurações permite renomear o workspace, cadastrar clientes e ativar módulos. Projetos reúne cards, tabela e cronograma. Dentro de cada projeto, as abas são Resumo, Tarefas, Arquivos e Governança. Os endereços antigos de Portfólio e Cronograma abrem Projetos na visualização correspondente.

As rotas usam hash (`#/app/documents`, por exemplo) para suportar recarga no GitHub Pages. Os dados antigos são preservados. Consulte [o mapa de implementação e limites](docs/PROTOTYPE-ALIGNMENT.md).

## Limites desta fase

Não há autenticação, sincronização entre dispositivos, controle de permissões no servidor nem armazenamento compartilhado de arquivos. Os usuários da demonstração representam perfis de exemplo; os tipos de papéis são a base para RBAC posterior. Solicitações de aprovação e regras locais estão disponíveis. Revisão formal de gates, permissões de aprovadores e execução de automações no servidor ainda dependem de backend. O protótipo antigo de board único foi substituído; dados salvos na chave antiga não são migrados automaticamente.
