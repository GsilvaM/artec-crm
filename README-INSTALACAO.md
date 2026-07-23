# Pacote de refatoração do Artec CRM

## Conteúdo

```text
docs/
  AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md
  PROMPT-MESTRE-REFATORACAO-ARTEC-CRM.md
.claude/
  agents/
    artec-crm-product-architect.md
    artec-design-system-engineer.md
    artec-auvo-integration-specialist.md
    artec-data-quality-e2e.md
    artec-qa-release-guardian.md
```

## Instalação

Copie o conteúdo deste pacote para a raiz:

```text
C:\Users\Artec Climatizados\Desktop\artec-crm
```

Não sobrescreva documentos existentes sem revisar o diff.

Coloque também na pasta `docs/`:

```text
ANALISE-PIXEL-A-PIXEL-VENTURE-DESIGN-SYSTEM.md
```

E o PDF em:

```text
docs/references/Venture-CRM-Dashboard-UI-kit.pdf
```

Reinicie o Claude Code para carregar os subagentes do projeto. Subagentes de projeto são definidos em `.claude/agents/`.

## Prompt inicial

```text
Leia integralmente docs/PROMPT-MESTRE-REFATORACAO-ARTEC-CRM.md e docs/AUDITORIA-ESTADO-ATUAL-ARTEC-CRM.md.

Use obrigatoriamente os cinco subagentes do projeto antes de implementar.

Comece pela auditoria real do repositório, banco, payloads Auvo, fixtures E2E e screenshots. Não faça commit nem push.
```

## Forma de execução recomendada

Não peça para concluir tudo em um único commit.

Use gates:

1. diagnóstico e E2E;
2. Auvo;
3. design system;
4. operação diária;
5. relatórios e acabamento.

No final de cada gate, revise screenshots e relatório antes de avançar.
