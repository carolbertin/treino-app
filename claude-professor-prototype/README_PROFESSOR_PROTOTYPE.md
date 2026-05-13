# README — Painel do Professor: Protótipo de Referência

> ⚠️ **Este protótipo é referência visual e comportamental, não código para substituir o app real.**
> O objetivo é mostrar ao Cursor exatamente como a UI deve se comportar.
> O app real usa Firebase, Firestore e uma arquitetura diferente.
> **Não copiar e colar diretamente.** Usar como guia de implementação.

---

## Como usar estes arquivos

1. Abra `professor-prototype.html` no browser — é interativo.
2. Leia os comentários no CSS e no JS — cada decisão visual e comportamental está explicada.
3. Use como referência ao implementar no `index.html`.

---

## O que este protótipo demonstra

### Pills de tipo — NUNCA dropdown

O tipo de bloco (Feeder set / Work set / Cluster set / Rest-pause / Back-off / Drop set)
são **pills clicáveis horizontais**. Nunca usar `<select>` para isso.

```
[ Feeder set ] [ ✓ Work set ] [ Cluster set ] [ Rest-pause ] [ Back-off ] [ Drop set ]
```

- Pill ativo: cor da técnica (fundo colorido + borda + texto escuro)
- Pills inativos: `opacity: 0.25` — esmaecidos mas visíveis
- Clicar um pill o ativa imediatamente
- O pill ativo mostra ✓ antes do label

### Preview ao vivo — "Interpretado como" + "O aluno verá"

Ao digitar no campo de notação, o feedback aparece imediatamente abaixo:

```
┌─────────────────────────────────────────┐  ← fundo verde #E1F5EE
│ INTERPRETADO COMO          (10px, verde) │
│ 2x10 (2 RIR)               (12px, bold)  │
│ ─────────────────────────────────────── │
│ 👤 O aluno verá:           (10px, verde) │
│ Série de preparação · 10r  (11px, cinza) │
│ Pare 2 reps antes da falha (11px, cinza) │
└─────────────────────────────────────────┘
```

Se não reconhecido:
```
┌─────────────────────────────────────────┐  ← fundo vermelho #FCEBEB
│ NÃO RECONHECIDO            (vermelho)   │
│ Use: 2x10 (2RIR)           (vermelho)   │
└─────────────────────────────────────────┘
```

**Implementação:** a cada `oninput`, chamar `liveNotation()` que atualiza
apenas os elementos `#hint_*` e `#prev_*` — sem re-render do card inteiro
(re-render perde o foco do input).

### Vínculo visual por cor entre exercício e blocos

Cada exercício recebe uma cor da paleta (azul, verde, laranja, roxo, coral).
Essa cor aparece em:
- `border-left` do card do exercício (3px)
- `background` e `color` do número circular
- `border-left` de todos os blocos filhos (2px)

Isso cria a hierarquia visual sem precisar de rótulos extras.

### Cards colapsados por padrão

A lista mostra linha compacta: número + nome + subtítulo dos blocos.
O subtítulo atualiza ao vivo: `"Feeder set · 2x10   Work set · 2x6-9   Back-off · 1x8..."`.

Campos secundários (vídeo, obs, substitutos) colapsados dentro de
"Vídeo, observações e substitutos". O professor raramente precisa deles.

### Bi-set como ligação entre exercícios

**Bi-set NÃO é um tipo de bloco.** É uma relação entre dois exercícios completos.

Fluxo:
1. Professor clica no ícone de corrente (🔗) do exercício A
2. Banner amarelo aparece: "Selecione outro exercício para vincular"
3. Professor clica no exercício B
4. Ponte visual aparece entre os dois cards: `—— Bi-set · clique para desvincular ——`
5. Clicar no badge desfaz a ligação

---

## Formatos de notação suportados

O parser é tolerante — aceita variações de espaçamento e ordem dos parâmetros.

| Tipo | Exemplos válidos |
|---|---|
| Feeder set | `2x10 (2RIR)` · `2x8-10 (1RIR)` · `1x10` |
| Work set | `1x8` · `2x6-9 (0RIR)` · `2x8 (1RIR)` |
| Cluster set | `1x4+4+4 (15 seg entre)` · `1x5+5+5 (15/20 seg entre)` · `1x4+4+4+4` |
| Rest-pause | `1x8 (15 seg) +99` · `2x7-9 (15seg, +4/5) (0RIR)` |
| Back-off | `1x8 (-30%, 40 seg) +99` · `1x7-9 (-20%, 30seg, +4/5) (0RIR)` |
| Drop set | `1x6-7 (0RIR) / 10 seg / -20% / 99 reps` |

**0 RIR** → "Vá até o limite" (não "Pare 0 reps antes da falha")
**+99** → código do professor para "ir até a falha"

---

## Mapeamento para o app real (index.html)

### Substituições

| App atual | Protótipo |
|---|---|
| `criarCardExercicio(i)` | `renderExCard(ei, p)` em professor-prototype.js |
| `htmlBlocosEditor(ex)` | `renderBlockCard()` em professor-prototype.js |
| `pillsHtmlBloco(b)` — usa pills já | Manter pills, ver `.type-row` no CSS |
| Dropdown `<select>` de técnica | **Nunca usar** — só pills |

### Campo `notation` → `meta`

O protótipo usa `bloco.notation` como campo de entrada.
No app real, o campo se chama `meta`. Ao implementar:

```js
// Ao carregar do Firestore para o editor:
bloco.notation = bloco.meta || '';

// Ao salvar do editor para o Firestore:
bloco.meta = bloco.notation;
// salvarRegistro() usa bloco.meta — não muda.
```

### Funções puras para adicionar ao index.html

Estas funções não têm efeitos colaterais. Adicionar ao final do `<script>`:

- `extractTokens(s)` — extrai tokens da string de notação
- `parse(notation, type)` — retorna `{ ok, interp, steps }` ou `{ ok:false, hint }`
- `renderPreview(p, type)` — retorna HTML do preview
- `liveNotation(ei, bi, inp)` — handler oninput

**Não remove** `interpretarPrescricao()` — as funções convivem.

### Novo campo `bisetWith`

```js
// Adicionar ao objeto exercício no Firestore:
exercicio.bisetWith = id_do_exercicio_par; // número ou string, ou null

// Na tela do aluno: se bisetWith !== null,
// o timer de descanso exibe "Agora: faça [nome do exercício par]"
// em vez do timer normal.
```

### Campo `obs` no exercício

Já existe no app como `ex.obs`. No protótipo aparece na seção colapsada
"Vídeo, observações e substitutos", logo após o campo de vídeo.

---

## O que NÃO alterar no app real

| Função | Por quê |
|---|---|
| `salvarRegistro()` | Coleta inputs e salva no Firestore. Não tocar. |
| `carregarHistoricoEx()` | Busca histórico + filtra por academia. Não tocar. |
| `normalizarExercicio()` | Compatibilidade com dados legados do Firestore. |
| `interpretarPrescricao()` | Usado por salvarRegistro. Novo parser convive. |
| `iniciarTimer()` | Timers existentes. Novo RestTimer é adicionado ao lado. |
| `replicarPeso()` | Funcionando. Não tocar. |
| Firebase config / Auth | Não tocar. |

---

## Estrutura dos arquivos

```
professor-prototype.html   — HTML estrutural (containers, topbar, intervalos)
professor-prototype.css    — Todos os estilos com comentários de princípio visual
professor-prototype.js     — Parser, render, estado e comportamento comentados
README_PROFESSOR_PROTOTYPE.md — Este arquivo
```

Os comentários nos arquivos `.css` e `.js` explicam cada decisão.
Leia-os antes de implementar.
