# Artec CRM — Design system e UX

## 1. Direção visual

O CRM deve parecer um produto operacional moderno, confiável e leve. A referência de implementação preferencial, quando a stack for React, é:

- shadcn/ui para componentes sob controle do projeto;
- primitives acessíveis Radix UI ou Base UI;
- Tailwind CSS com tokens semânticos;
- Lucide Icons;
- Sonner para toasts;
- TanStack Table para listas densas;
- dnd-kit para drag-and-drop acessível, se necessário.

Não copiar demos literalmente. Aplicar identidade da Artec e padrões consistentes.

## 2. Princípios

- Clareza antes de decoração.
- Densidade confortável para operação diária.
- Informação urgente deve se destacar sem deixar a tela alarmista.
- Mesma ação deve parecer e funcionar igual em todas as telas.
- Formulários devem pedir apenas o necessário naquele momento.
- Preferir painel lateral (sheet) para consulta/edição rápida; página completa para contextos extensos.
- Evitar modais empilhados.
- Evitar tabelas gigantes sem filtros, hierarquia ou ações contextuais.
- Não usar cor como única forma de comunicar estado.

## 3. Tokens

Criar tokens semânticos, não cores hardcoded por componente:

- background
- surface
- surface-muted
- foreground
- foreground-muted
- border
- primary
- primary-foreground
- success
- warning
- danger
- info
- focus-ring
- stage-* apenas quando necessário

Extrair a cor principal e tipografia da identidade visual já disponível no repositório. Se não houver definição confiável, usar base neutra e registrar uma decisão de design antes de inventar a paleta.

Suportar modo claro no MVP. Modo escuro só entra se puder ser entregue completo, sem contrastes quebrados.

## 4. Tipografia e espaçamento

- Fonte de interface legível, com números claros.
- Títulos curtos e funcionais.
- Escala consistente de 4/8 px.
- Altura mínima confortável para controles.
- Conteúdo principal com largura que aproveite desktop sem criar linhas longas demais.
- Valores, datas e contagens alinhados para leitura rápida.

## 5. Navegação

Menu sugerido:

- Visão geral
- Caixa de Entrada
- Oportunidades
- Funil
- Follow-ups
- Agenda
- Clientes
- Orçamentos
- Relatórios
- Configurações

Incluir:

- busca global;
- atalho para novo lead/oportunidade;
- sino de notificações;
- perfil do usuário;
- indicador discreto da integração Auvo.

## 6. Padrões de tela

### Central Comercial

Resumo acionável, sem mural de gráficos. Priorizar listas curtas com botões diretos.

### Caixa de Entrada

Layout master-detail:

- lista à esquerda;
- detalhes e ações à direita;
- filtros no topo;
- atalhos de teclado para avançar entre itens;
- confirmação clara antes de descartar ou vincular.

### Oportunidades

Oferecer lista e kanban. A lista é melhor para filtros e trabalho em massa; o kanban é melhor para visão de fluxo.

### Ficha do cliente/oportunidade

Cabeçalho com estado atual e próxima ação. Corpo com tabs ou seções:

- resumo;
- linha do tempo;
- orçamentos;
- tarefas/follow-ups;
- dados do cliente;
- vínculos Auvo.

### Formulários rápidos

Abrir em sheet/modal curto. Salvar com `Ctrl/Cmd + Enter` quando seguro. Preservar rascunho local em formulários longos.

## 7. Componentes obrigatórios

- App shell
- Sidebar responsiva
- Command palette/busca global
- Cards de tarefa com urgência
- Data table com filtros
- Kanban card
- Timeline
- Activity composer
- Date picker e seleção de horário
- Empty state
- Skeleton
- Error state com recuperação
- Badge semântico
- Sheet de detalhes
- Confirm dialog para ações destrutivas
- Notification center
- Toasts

## 8. Acessibilidade

- Navegação completa por teclado.
- Foco visível.
- Labels e descrições para inputs.
- Semântica correta de headings, tabelas e dialogs.
- Contraste conforme WCAG AA.
- Alvos clicáveis adequados.
- `aria-live` para feedback importante, sem excesso.
- Respeitar `prefers-reduced-motion`.
- Drag-and-drop deve ter alternativa por botões e teclado.

## 9. Microinterações

Usar movimento curto e funcional:

- confirmação de item concluído;
- atualização otimista com rollback em erro;
- highlight breve em item atualizado;
- skeleton no carregamento inicial;
- transições discretas em sheets e menus.

Não usar animações longas, confete ou efeitos que atrasem a operação.

## 10. Linguagem

Português do Brasil, direto e humano.

Preferir:

- “Próxima ação”
- “Atrasado há 2 dias”
- “Criar oportunidade”
- “Vincular ao cliente”
- “Registrar garantia”
- “Marcar como perdido”

Evitar jargões técnicos, mensagens vagas e textos longos em botões.
