# SymOS — alinhamento aos protótipos

Referências: 14 imagens do ZIP `gpt.zip` de 28/09/2026 e a referência adicional de board/tabela. A implementação preserva o núcleo de projetos e o catálogo de módulos Symco separados.

| Referência                        | Implementação                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Visão Geral / Painel de Portfólio | KPIs derivados, quatro projetos em destaque, etapas e atividades                                                                                 |
| Portfólio                         | Tabela inicial, filtros, KPIs e alternativas de visualização                                                                                     |
| Projetos                          | Cards iniciais, filtros e abertura do projeto                                                                                                    |
| Criar projeto / Projeto Aky       | Fluxos existentes preservados, navegação e densidade compartilhadas                                                                              |
| Cronograma                        | Gantt com escala de 3/6/12 semanas, navegação de período, lista de prazos, marcos e gates                                                        |
| Documentos / referência de board  | Pastas, filtros combinados, tabela com agrupamentos recolhíveis, seleção, versão, responsável, status, aprovação, paginação e painel de detalhes |
| Qualidade                         | Auditorias, não conformidades, CAPAs, responsáveis, prazos e edição persistente                                                                  |
| Aprovações                        | Filtros, solicitações, responsáveis e painel para registrar decisões                                                                             |
| Automações                        | Modelos, criação, edição, pausa/ativação e histórico de execuções                                                                                |
| Relatórios                        | Indicadores e gráficos derivados, filtros de período e exportação CSV                                                                            |
| Configurações                     | Nome do workspace, membros, clientes, módulos e metodologias                                                                                     |

## Comportamento e persistência

- A chave `symos-database-v1` é preservada. Os novos campos são opcionais; registros de versões anteriores continuam válidos. Não se sobrescrevem dados salvos com o novo conjunto de exemplos.
- Documentos podem conter um link HTTP(S), um registro sem arquivo ou os bytes de um arquivo local de até 2 MB. Dados de demonstração são **metadados**; não representam arquivos que já foram enviados. O painel distingue arquivo, link e registro.
- O limite total disponível depende da cota de localStorage. Uma falha de gravação mantém o formulário aberto e não publica o novo estado.
- As automações reagem a uma nova conclusão de tarefa ou adição de documento, com escopo de workspace/projeto. Criam uma solicitação de aprovação ou tarefa de revisão para o responsável. Regravar uma conclusão/editar um documento não dispara outra execução.
- A ação da regra, seu contador e o evento de origem são persistidos juntos. Sem agendamento em segundo plano, emails ou integrações externas.
- O Gantt usa o início do projeto e o prazo da tarefa. A aplicação ainda não modela data de início independente de cada tarefa. Marcos e gates usam sua data de prazo.
- Relatórios contam apenas os dados do workspace ativo. O período considera interseção com o intervalo de execução do projeto. CSV usa valores de texto escapados para evitar interpretação de fórmulas pelo Excel.
- Rotas por hash preservam o prefixo de hospedagem do GitHub Pages e funcionam ao recarregar. URLs antigas `/app` continuam sendo interpretadas quando o servidor entrega o SPA.
- Status do documento e decisão de aprovação são campos locais independentes. Alterar uma aprovação não libera automaticamente um gate, nem aplica controle de acesso de servidor.

## Verificação

`npm test` cobre fluxos existentes, novas páginas, criação/edição de documentos, bytes enviados, links inválidos, configurações de workspace vazio, novas solicitações, registros de qualidade, regras, disparos repetidos, isolamento de escopo e falha de persistência. `npm run build` valida TypeScript e o bundle de produção. Há também build com o prefixo `/Symco/`.

O ambiente desta execução não forneceu um navegador para inspeção visual. A adaptação responsiva usa grids flexíveis, tabelas com rolagem interna e breakpoints de 1500/1200/1000/767 px, mas ainda deve ser conferida visualmente em desktop e celular no PR.

## Limites

Esta entrega continua sendo um protótipo funcional local. Autenticação, permissões reais, armazenamento compartilhado de arquivos, colaboração entre dispositivos e execução de regras no servidor dependem de backend. Não foram introduzidos serviços externos nem migrations de banco.
