# UX_VOLUME_SYSTEM.md
> Documento de referência oficial para o painel de volumes do app de personal trainer.
> Serve como guideline para o Cursor e para qualquer tela futura do produto.
> Baseado no protótipo `volume_treino_v7`.

---

## 1. Objetivo do painel

Permitir que o professor visualize, de forma rápida e sem ruído, o volume prescrito e o volume realizado por grupamento muscular — com a possibilidade de simular semanas diferentes ativando ou desativando treinos individualmente.

O app apresenta os dados. O professor faz a análise. A interface não opina.

---

## 2. Princípios fundamentais

- **Clareza antes de completude** — mostrar menos com mais precisão é melhor do que mostrar tudo com ruído.
- **O professor é o especialista** — a interface não emite alertas, não sugere o que é ideal, não coloca badges de "baixo" ou "alto". Isso é julgamento do profissional.
- **Dado > Decoração** — cada elemento visual deve carregar informação. Se não carrega, não existe.
- **Consistência silenciosa** — padrões visuais devem ser percebidos, não notados. O professor não deve pensar sobre o layout — deve pensar sobre os dados.
- **Densidade com respiro** — alta densidade de informação não significa interface comprimida. O espaço negativo é parte do design.

---

## 3. Hierarquia visual

Três níveis apenas. Nunca mais que três.

| Nível | Elemento | Tamanho | Peso | Cor |
|---|---|---|---|---|
| 1 | Nome do aluno | 16px | 500 | `color-text-primary` |
| 2 | Títulos de seção dos cards | 12px maiúsculo | 500 | `color-text-secondary` |
| 3 | Conteúdo (grupamentos, números, treinos) | 13px | 400 ou 500 | `color-text-primary` ou `color-text-secondary` |

O que é resposta (número de séries, valor da barra) usa `color-text-primary` + peso 500.
O que é contexto (nome do grupamento, label do tipo de barra) usa `color-text-secondary` + peso 400.

**Nunca usar tamanho de fonte para criar hierarquia dentro do conteúdo.** A diferença entre primário e secundário é cor e peso — não tamanho.

---

## 4. Tipografia

- **Família:** sans-serif do sistema (`var(--font-sans)`)
- **Pesos permitidos:** 400 (regular) e 500 (medium). Jamais 600 ou 700.
- **Tamanhos permitidos nesta tela:**
  - 16px — nome do aluno (único uso)
  - 13px — todo o conteúdo
  - 12px — títulos de seção e labels secundários
  - 11px — labels de tipo de barra ("prescrito", "realizado")
- **Letter-spacing:** apenas nos títulos de seção (12px maiúsculo) — valor `0.05em`
- **Line-height:** 1.5 para conteúdo corrido. Linhas isoladas (labels, números) não precisam de line-height explícito.
- **Nunca usar ALL CAPS** exceto nos títulos de seção dos cards, onde serve para diferenciar sem aumentar tamanho.

---

## 5. Spacing

### Macro (entre blocos)
- Entre o cabeçalho e o primeiro card: `1.25rem`
- Entre cards: `1rem`
- Grid de dois cards lado a lado: `gap: 1rem`

### Micro (dentro dos cards)
- Padding interno do card: `1rem 1.25rem` (vertical / horizontal)
- Entre título da seção e conteúdo: `margin-bottom: 1rem`
- Entre linhas de grupamento no "por treino": `padding: 6px 0` com borda de separação `0.5px`
- Entre blocos de treino: `12px` de espaço (sem linha separadora — o espaço já agrupa)
- Entre grupos de barras: `margin-bottom: 12px`
- Entre as duas barras de um mesmo grupamento: `margin-bottom: 3px`
- Altura das barras: `6px`

### Regra geral
Usar `rem` para ritmo vertical entre blocos. Usar `px` para espaçamentos internos a componentes.

---

## 6. Cores

### Barras de volume
- **Prescrito:** `#7F77DD` (roxo)
- **Realizado:** `#1D9E75` (verde)

As cores codificam **origem do dado** — não grupo muscular, não intensidade, não status.

Roxo = planejamento. Verde = execução. A escolha é semântica: verde carrega a conotação universal de "concluído". Roxo é neutro o suficiente para não sugerir alerta ou destaque.

### Texto
Usar sempre variáveis CSS do sistema:
- `var(--color-text-primary)` — informação principal
- `var(--color-text-secondary)` — contexto e labels
- `var(--color-text-tertiary)` — elementos desativados, hints

### Bordas
- Cards: `0.5px solid var(--color-border-tertiary)`
- Separadores de linha: `0.5px solid var(--color-border-tertiary)`
- Nunca usar bordas mais espessas que 0.5px em elementos estruturais

### Fundos
- Card: `var(--color-background-primary)` (branco/escuro conforme tema)
- Barras (track vazio): `var(--color-background-secondary)`
- Página: transparente — o host define o fundo

---

## 7. Componentes

### Card
```
background: var(--color-background-primary)
border: 0.5px solid var(--color-border-tertiary)
border-radius: 12px (var(--border-radius-lg))
padding: 1rem 1.25rem
```
Sem shadow. Sem fundo colorido. O card é definido pelo contraste com o fundo da página, não pela borda.

### Título de seção
```
font-size: 12px
font-weight: 500
text-transform: uppercase
letter-spacing: 0.05em
color: var(--color-text-secondary)
margin-bottom: 1rem
```

### Barra de volume
```
altura do track: 6px
border-radius: 3px
transição de largura: 0.3s ease
largura mínima visível: 4px (nunca zero)
largura relativa ao maior valor prescrito do conjunto
```

### Toggle de treino
```
font-size: 12px
padding: 4px 12px
border-radius: 20px
border: 0.5px solid var(--color-border-secondary)
estado ativo: background var(--color-background-primary), cor primary
estado inativo: texto com line-through, cor tertiary, border tertiary
```

### Legenda
```
posição: acima das barras
layout: flex horizontal com gap 14px
dot: 10x6px, border-radius 2px
font-size: 12px
cor: color-text-secondary
```

---

## 8. Comportamento

### Toggles de treino
- Ao clicar em um treino ativo, ele é desativado: o botão recebe `text-decoration: line-through` e cor terciária.
- O volume prescrito é recalculado em tempo real — as barras animam suavemente (`transition: width 0.3s ease`).
- O volume realizado **não muda** ao desativar treinos. Ele reflete execução histórica, não planejamento.
- Múltiplos treinos podem ser desativados simultaneamente.
- Não há botão de confirmação — a ação é imediata e reversível.

### Ordenação das barras
- Sempre ordenadas por volume prescrito decrescente (dos ativos).
- A ordenação atualiza em tempo real quando treinos são ativados/desativados.
- O grupamento com maior volume prescrito ativo sempre tem a barra chegando próximo ao limite direito.

### Leitura das barras
- Prescrito sempre em cima, realizado sempre embaixo.
- O comprimento relativo entre as duas barras comunica aderência: barras iguais = execução completa, barra verde menor = execução parcial.
- Não há percentual explícito — a leitura é visual e intencional.

---

## 9. Responsividade

### Desktop / tablet largo
- Grid de dois cards lado a lado: `grid-template-columns: 1fr 1fr`
- Os cards crescem em altura conforme o conteúdo — nunca scroll interno

### Mobile (< 600px)
- Grid quebra para coluna única: `grid-template-columns: 1fr`
- Card de volume semanal em cima, "por treino" embaixo
- Width do label das barras reduz de 136px para 100px
- Nomes longos recebem `text-overflow: ellipsis`
- Toggles fazem `flex-wrap: wrap` — já funciona por padrão

### Muitos grupamentos (mais de 9)
- Empilham normalmente — não paginar, não colapsar
- O professor precisa da visão completa para comparar
- Se passar de 12, reduzir altura das barras para 4px e gap entre grupos para 8px

### Muitos treinos (mais de 6)
- Os toggles fazem wrap automaticamente
- O card cresce em altura — sem scroll interno
- Em mobile, considerar que a lista de toggles pode ocupar 2–3 linhas

### Valores muito altos
- O sistema de proporção relativa ao máximo continua correto
- Garantir largura mínima de 4px para qualquer barra — nunca renderizar barra invisível

### Nomes longos de grupamento
- Label com width fixo + `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- O nome completo é legível nas linhas do "por treino" — não é informação perdida

---

## 10. Sensação visual

A tela deve parecer um **documento vivo**, não um painel de software.

A diferença:
- Documentos têm espaço negativo generoso, tipografia discreta, estrutura que emerge do conteúdo.
- Painéis de software têm boxes empilhados, headers coloridos, shadows, badges, ícones decorativos.

Referências corretas: **Linear**, **Raycast**, **Notion**. Interfaces onde cada elemento tem função e nada é adicionado para "parecer mais completo".

O professor deve abrir a tela e sentir que a informação estava esperando por ele — organizada, sem ruído, sem precisar procurar. Em 10 segundos deve saber se o plano está equilibrado. A interface não explica, não alerta, não avalia. Apresenta os dados e sai do caminho.

---

## 11. Anti-patterns — o que nunca fazer

### Tipografia
- ❌ Usar peso 600 ou 700
- ❌ Variar tamanho de fonte para criar hierarquia dentro do conteúdo
- ❌ ALL CAPS em elementos de conteúdo (apenas títulos de seção)
- ❌ Repetir unidade "séries" depois de cada número — o contexto já está estabelecido

### Cores
- ❌ Usar cor para decoração — cor codifica significado ou não existe
- ❌ Fundo colorido em headers de card
- ❌ Usar mais de duas cores nas barras
- ❌ Hardcodar cores que não se adaptam a dark mode

### Estrutura
- ❌ Shadows em cards
- ❌ Bordas mais espessas que 0.5px em separadores
- ❌ Ícones decorativos antes de labels
- ❌ Badges de status ("ideal", "baixo", "alto") — o professor decide
- ❌ Tooltips explicando o óbvio
- ❌ Alertas automáticos sobre desequilíbrios
- ❌ Ordenação alfabética dos grupamentos

### Comportamento
- ❌ Animações longas ou chamativas nos toggles
- ❌ Modal de confirmação para ativar/desativar treino
- ❌ Scroll interno dentro dos cards
- ❌ Paginação dos grupamentos

---

## 12. O que faz parecer bootstrap / admin panel

Qualquer um dos itens abaixo, isolado, quebra o feeling:

- Usar `<table>` com `<thead>` e bordas em todos os lados
- Usar `badge` colorido em cada linha de dado
- Usar `card-header` com fundo cinza ou colorido
- Usar `btn-primary` azul sólido
- Usar `box-shadow` nos cards
- Usar `<hr>` como separador
- Colocar ícone antes de cada label
- Usar grid de 12 colunas Bootstrap com gutters visíveis
- Line-height comprimido (< 1.4) que remove o respiro entre linhas

---

## 13. Filosofia do produto

Este app é uma ferramenta profissional para personal trainers. O professor tem conhecimento técnico — ele não precisa que o app tome decisões por ele ou explique conceitos básicos.

A interface deve tratar o professor como especialista:
- Mostra dados completos sem filtrar o que "parece importante"
- Não emite julgamentos sobre o que é volume suficiente
- Não sugere correções
- Não gamifica o processo de prescrição

A responsabilidade pela qualidade do treino é do professor. A responsabilidade da interface é apresentar as informações com clareza, velocidade e sem ruído.

**Menos opiniões na interface = mais espaço para o julgamento profissional.**

---

## 14. Extensões futuras (manter consistência)

Quando novas telas ou seções forem adicionadas ao painel de volumes, seguir:

- Mesma paleta de dois tons para barras (prescrito/realizado)
- Mesma lógica de toggles para filtros interativos
- Mesmo padrão de card (sem shadow, border 0.5px, radius 12px)
- Mesma hierarquia tipográfica de três níveis
- Nunca adicionar alertas automáticos — no máximo, dados que o professor interpreta
- Volume realizado nunca é alterado por interações de simulação — é dado histórico imutável na UI

---

*Documento gerado com base no protótipo `volume_treino_v7`. Atualizar este documento sempre que uma decisão de produto alterar os princípios aqui descritos.*
