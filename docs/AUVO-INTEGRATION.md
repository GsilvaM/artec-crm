# Artec CRM — Integração com o Auvo

## 1. Escopo

A integração serve para reduzir digitação e capturar atendimentos comerciais. Não conecta o CRM ao financeiro do Auvo e não transforma o CRM em uma cópia das conversas.

## 2. Eventos do MVP

Configurar no Auvo:

- Atendimento criado
- Atendimento alterado
- Atendimento concluído
- Contato criado
- Contato alterado

Não configurar no MVP:

- Mensagem atualizada
- Mensagem recebida
- Mensagem enviada
- Contato etiqueta alterada
- Pagamento criado
- Pagamento alterado
- Painel/Card/Anotação
- Modelo de mensagem

## 3. Fluxo

1. Auvo envia webhook HTTPS.
2. Endpoint valida o básico e persiste o payload bruto.
3. Endpoint responde 2xx rapidamente.
4. Worker/processador verifica idempotência.
5. Campos conhecidos são normalizados.
6. Se necessário, backend consulta a API do Auvo em modo leitura.
7. CRM cria/atualiza item na Caixa de Entrada.
8. Vendedor classifica manualmente.

## 4. Caixa de Entrada

Um atendimento externo corresponde a no máximo um item. O CRM sugere cliente por:

1. `auvo_contact_id`;
2. telefone normalizado;
3. e-mail;
4. nome aproximado apenas como sugestão.

O vendedor escolhe o destino. Nunca vincular automaticamente apenas por nome.

## 5. Idempotência

Prioridade:

1. ID único do evento, se fornecido;
2. ID do atendimento + tipo de evento + versão/timestamp;
3. hash canônico do payload como fallback.

Usar constraints únicas no banco, não apenas verificação em memória.

## 6. Segurança

- HTTPS obrigatório.
- Segredos apenas no backend.
- `.env.example` sem valores reais.
- Assinatura oficial do Auvo, se disponível, deve ser validada.
- Se não houver assinatura: URL secreta, rate limit, validação de schema, logs de IP/headers sanitizados e verificação posterior de IDs pela API.
- Não registrar token em logs.
- Rotacionar o token exposto durante o planejamento antes da homologação.

## 7. Autenticação da API

Criar um módulo isolado para:

- obter token temporário com API Key + API Token;
- armazenar token somente no servidor;
- renovar antes da expiração;
- serializar renovações concorrentes para evitar várias autenticações;
- tratar 401 com uma única renovação e retry controlado;
- respeitar rate limit;
- registrar métricas sem expor credenciais.

Não assumir endpoints ou formatos. Confirmar na documentação oficial e em respostas reais.

## 8. Homologação obrigatória

Antes de mapear eventos, criar um receptor de homologação que salve payload e headers sanitizados. Capturar amostras reais de:

- atendimento novo com contato novo;
- atendimento novo com contato existente;
- atendimento alterado;
- atendimento concluído;
- contato criado;
- contato alterado;
- evento repetido;
- payload sem telefone;
- indisponibilidade temporária da API.

Criar fixtures anonimizadas a partir das amostras e testes de contrato.

## 9. Observabilidade

Tela administrativa com:

- integração ativa/inativa;
- teste de conexão;
- último webhook recebido;
- último evento processado;
- fila pendente;
- eventos com erro;
- tentativas;
- reprocessamento manual;
- payload sanitizado;
- correlação entre evento, atendimento, cliente e oportunidade.

## 10. Estados técnicos do evento

- received
- processing
- processed
- ignored
- failed
- dead_letter

Erros devem ser reprocessáveis sem duplicar dados.
