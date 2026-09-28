# SymOS

Protótipo funcional de gestão de projetos da Symco. A aplicação usa React, TypeScript e Vite. Os dados são locais ao navegador nesta primeira fase.

## Executar

```bash
npm ci
npm run dev
npm test
npm run build
```

Abra o endereço exibido pelo Vite. `/` apresenta o aplicativo, e as rotas de trabalho ficam sob `/app`.

## Organização

- `src/domain`: modelos tipados, catálogo de módulos e templates, dados iniciais e seletores derivados.
- `src/repositories`: contrato de persistência e implementação `localStorage`.
- `src/application`: ações de criação/edição, atualização imediata e registro de atividade.
- `src/features`: telas de dashboard, portfólio, projeto, criação e governança.
- `src/components/os`: componentes reutilizados entre as telas.
- `src/styles/os.css`: tokens básicos e estilos responsivos.

O banco local é semeado apenas na primeira visita (`symos-database-v1`). Cada projeto pertence a um workspace; os seletores e telas filtram os projetos pelo workspace ativo. O progresso é calculado a partir das tarefas concluídas. A metodologia e suas etapas são dados e podem ser escolhidas ou criadas no fluxo de novo projeto. Os serviços Symco ficam em um catálogo à parte do núcleo de projetos.

## Fluxo disponível

Troque de workspace, crie um projeto com template ou etapas próprias, escolha membros, abra o projeto, crie e edite tarefas, mova tarefas entre colunas do Kanban, comente, registre documentos como metadados ou links, riscos e decisões. Dashboard, portfólio, busca e atividade refletem as alterações. A recarga conserva os dados no mesmo navegador.

## Limites desta fase

Não há autenticação, sincronização entre dispositivos, controle de permissões no servidor nem upload de arquivos. Os usuários da demonstração representam perfis de exemplo; os tipos de papéis são a base para RBAC posterior. A aprovação existente pode mudar de estado; um fluxo completo de solicitação, revisão de gates e automações ainda precisa de backend e regras de negócio. O protótipo antigo de board único foi substituído; dados salvos na chave antiga não são migrados automaticamente.
