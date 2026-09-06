export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Bloqueado' | 'Concluído' | 'Cancelado'
export type Task = {
  id: string; module: string; gate: string; title: string; owner: string; support: string;
  start: string; due: string; status: TaskStatus; priority: 'Crítica' | 'Alta' | 'Média';
  progress: number; plannedHours: number; actualHours: number; dependency?: string;
  evidence: string; nextAction: string
}

export const tasks: Task[] = [
  { id:'T001', module:'SymÁgile', gate:'G0', title:'Kick-off e Project Charter', owner:'Patrick Tanaka', support:'Aky + P&D + Reg. + Qualidade', start:'07/09/2026', due:'09/09/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:4, actualHours:0, evidence:'Project Charter', nextAction:'Validar escopo, targets e governança' },
  { id:'T002', module:'SymInsights', gate:'G0', title:'Panorama competitivo + Business Case', owner:'Patrick Tanaka', support:'Aky', start:'08/09/2026', due:'15/09/2026', status:'Não iniciado', priority:'Alta', progress:0, plannedHours:20, actualHours:0, dependency:'T001', evidence:'SymInsights', nextAction:'Validar premissas de mercado' },
  { id:'T003', module:'SymProduct', gate:'G1', title:'Definir targets Popular e Premium', owner:'Rinaldo Trajano / Filipe Favatto', support:'Patrick + Aky', start:'10/09/2026', due:'15/09/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:12, actualHours:0, dependency:'T001', evidence:'Product Design Brief', nextAction:'Congelar arquitetura de produto' },
  { id:'T004', module:'SymProduct', gate:'G2', title:'Protótipos — Linha Popular', owner:'Rinaldo Trajano', support:'P&D + Patrick', start:'15/09/2026', due:'05/10/2026', status:'Não iniciado', priority:'Alta', progress:0, plannedHours:48, actualHours:0, dependency:'T003', evidence:'Registro de Protótipos + scorecard', nextAction:'Selecionar candidato' },
  { id:'T005', module:'SymProduct', gate:'G2', title:'Protótipos — Linha Premium', owner:'Filipe Favatto', support:'P&D + Patrick', start:'15/09/2026', due:'05/10/2026', status:'Não iniciado', priority:'Alta', progress:0, plannedHours:48, actualHours:0, dependency:'T003', evidence:'Registro de Protótipos + scorecard', nextAction:'Selecionar candidato' },
  { id:'T006', module:'SymProduct', gate:'G2', title:'Consolidação P&D Candidate', owner:'Rinaldo / Filipe', support:'Patrick + Aky', start:'05/10/2026', due:'09/10/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:12, actualHours:0, dependency:'T004; T005', evidence:'Protótipo + scorecard', nextAction:'Liberar para checks técnicos' },
  { id:'T007', module:'SymQuality Reg.', gate:'G3', title:'Regulatory Verification Check', owner:'Renata Franco', support:'P&D + Patrick', start:'09/10/2026', due:'16/10/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:30, actualHours:0, dependency:'T006', evidence:'Regulatory Verification Checklist', nextAction:'Classificar BLOCKER / MAJOR / MINOR' },
  { id:'T008', module:'SymQuality', gate:'G4', title:'Manufacturing Readiness Check', owner:'Eduardo Pereira', support:'Aky + P&D + Patrick', start:'09/10/2026', due:'16/10/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:30, actualHours:0, dependency:'T006', evidence:'Manufacturing Readiness Checklist', nextAction:'Tratar gaps críticos' },
  { id:'T009', module:'SymÁgile', gate:'G3–G4', title:'Gate review técnico + pendências', owner:'Patrick Tanaka', support:'P&D + Reg. + Qualidade + Aky', start:'16/10/2026', due:'19/10/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:6, actualHours:0, dependency:'T007; T008', evidence:'Ata de Gate + Action Log', nextAction:'Decidir Go / Hold / Return' },
  { id:'T010', module:'Cliente', gate:'G5', title:'Aprovação Aky + Formula Lock', owner:'Aky', support:'Patrick + P&D', start:'19/10/2026', due:'24/10/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:0, actualHours:0, dependency:'T009', evidence:'Termo + Formula Lock', nextAction:'Formalizar versão aprovada' },
  { id:'T011', module:'SymÁgile', gate:'G5+', title:'Change Control após Formula Lock', owner:'Patrick Tanaka', support:'Todos', start:'24/10/2026', due:'16/11/2026', status:'Não iniciado', priority:'Alta', progress:0, plannedHours:4, actualHours:0, dependency:'T010', evidence:'Change Request Log', nextAction:'Registrar mudanças relevantes' },
  { id:'T012', module:'SymProduct / Qualidade', gate:'G6', title:'Teste industrial / Scale-up', owner:'P&D + Aky', support:'Qualidade + Patrick', start:'27/10/2026', due:'04/11/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:12, actualHours:0, dependency:'T010', evidence:'Industrial Trial Report', nextAction:'Confirmar parâmetros e desvios' },
  { id:'T013', module:'SymProduct', gate:'G6', title:'Golden Process + Technical Release', owner:'P&D + Symco', support:'Qualidade + Aky + Patrick', start:'04/11/2026', due:'09/11/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:8, actualHours:0, dependency:'T012', evidence:'Golden Process + Technical Release', nextAction:'Fechar pendências técnicas' },
  { id:'T014', module:'Qualidade', gate:'G6', title:'Shelf Life Protocol / acompanhamento', owner:'Qualidade + Aky', support:'P&D + Patrick', start:'27/10/2026', due:'06/12/2026', status:'Não iniciado', priority:'Alta', progress:0, plannedHours:0, actualHours:0, dependency:'T012', evidence:'Shelf Life Protocol', nextAction:'Validar somente com evidência' },
  { id:'T015', module:'Aky', gate:'G7', title:'Launch Ready / decisão de lançamento', owner:'Aky', support:'Patrick + P&D + Reg. + Qualidade', start:'09/11/2026', due:'16/11/2026', status:'Não iniciado', priority:'Crítica', progress:0, plannedHours:0, actualHours:0, dependency:'T013', evidence:'Decisão de lançamento', nextAction:'Confirmar pendências tratadas' },
  { id:'T016', module:'SymÁgile', gate:'G7', title:'Encerramento + lições aprendidas', owner:'Patrick Tanaka', support:'Todos', start:'16/11/2026', due:'19/11/2026', status:'Não iniciado', priority:'Média', progress:0, plannedHours:6, actualHours:0, dependency:'T015', evidence:'Close-out + Lessons Learned', nextAction:'Encerrar projeto' },
]

export const gates = [
  ['G0','Brief','Project Lead + Aky','O que será desenvolvido?','Project Charter + targets','09/09/2026'],
  ['G1','Design Freeze','P&D','Arquitetura definida?','Product Design Brief','15/09/2026'],
  ['G2','P&D Candidate','P&D','Candidato tecnicamente aceitável?','Protótipo + scorecard','09/10/2026'],
  ['G3','Regulatory Check','Regulatório','Formulação compatível?','Checklist / parecer','16/10/2026'],
  ['G4','Manufacturing Readiness','Qualidade','Fábrica e processo suportam o produto?','Checklist + ações','16/10/2026'],
  ['G5','Client Approval','Aky','Aky aprova a versão?','Termo + Formula Lock','24/10/2026'],
  ['G6','Scale / Release','P&D + Aky','Scale-up confirma parâmetros?','Golden Process + Release','09/11/2026'],
  ['G7','Launch Ready','Aky','Pendências críticas tratadas?','Decisão de lançamento','16/11/2026'],
] as const

export const risks = [
  ['R001','Risco','G2','Protótipos não atingirem target técnico/sensorial','Alta','P&D','Atraso em G2','Rodadas de protótipo + decisão baseada em scorecard'],
  ['R002','Risco','G3','BLOCKER regulatório na formulação candidata','Crítica','Regulatório','Retorno a P&D','Checklist regulatório antes da aprovação do cliente'],
  ['R003','Risco','G4','Gap crítico de fabricação / processo','Crítica','Qualidade + Aky','Impede G5','Plano de ação de Manufacturing Readiness'],
  ['D001','Decisão','G5','Aprovação da versão final pela Aky','Crítica','Aky','Formula Lock','Termo de aprovação formal'],
  ['CR001','Mudança','G5+','Alteração relevante após Formula Lock','Alta','Patrick / solicitante','Prazo, custo e escopo','Abrir Change Request antes de executar'],
] as const

export const documents = [
  ['Project Charter','G0','Patrick + Aky'],['Product Design Brief','G1','P&D'],['Registro de Protótipos','G2','P&D'],
  ['Regulatory Verification Checklist','G3','Regulatório'],['Manufacturing Readiness Checklist','G4','Qualidade'],
  ['Formula Lock','G5','P&D + Aky'],['Change Request','G5+','Patrick / solicitante'],['Industrial Trial Report','G6','P&D + Aky'],
  ['Golden Process','G6','P&D'],['Shelf Life Protocol','G6','Qualidade'],['Product Development Book','G6','P&D'],
  ['Termo de Aprovação do Cliente','G5','Aky'],['Technical Release','G6','Symco'],
] as const

export const weeks = [
  ['W1','07/09',4],['W2','14/09',4],['W3','21/09',4],['W4','28/09',4],['W5','05/10',4],
  ['W6','12/10',5],['W7','19/10',4],['W8','26/10',3],['W9','02/11',4],['W10','09/11',4],
] as const
