# Changelog (alterações assistidas por IA)

## 2026-05-11

### Tela do aluno — multi-bloco (referência UX protótipo Claude)

- **Integração visual** inspirada no protótipo em `claude-prototype/tela-aluno-referencia` (apenas layout e hierarquia; sem React, sem novo build).
- **Barra segmentada** no topo de `#series-inputs` quando o exercício tem mais de um bloco (`nBl > 1`): um segmento por bloco; o primeiro segmento com destaque visual (“ativo”), os demais pendentes/neutros.
- **Bloco inicial** (`bi === 0`) com aparência de etapa ativa: cabeçalho com borda lateral e sombra reforçadas (classe `bloco-aluno-wrap--ativo`).
- **Blocos seguintes** com estilo secundário no cabeçalho (`bloco-aluno-wrap--secundario`) e linha discreta **“A seguir: …”** usando o `preview` de `alunoCopyBloco` (fallback para `tituloAluno` se o preview estiver vazio).
- **Sem alteração** em `salvarRegistro`, Firebase, histórico, timers, painel do professor, renderização mono-bloco, `skipInteractive`, prefixos de input ou lógica de coleta.
