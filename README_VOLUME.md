# Volume — Referência (versão simplificada)

> ⚠️ Referência visual e comportamental — não substituir o app diretamente.
> Abra `volume-prototype.html` no browser antes de implementar.

---

## O que esta tela é

Tela de volume de treino já dentro da aba de um aluno específico.

**Sem:** seletor de aluno, toggle de comparar, mini-histograma de dias, séries por treino dentro da semana.

**Com:**
- Tabs: "Por treino" | "Por semana"
- **Por treino:** pills de sessão + 1 KPI + gráfico barras verticais por grupamento
- **Por semana:** 1 KPI + gráfico barras verticais por grupamento (semana agregada)

---

## Regras críticas de implementação

**1. Volume = número de séries. Nunca peso × reps.**

**2. Gráfico de barras VERTICAIS com Chart.js.**
```js
type: 'bar'   // vertical — nunca horizontalBar nem indexAxis:'y'
```

**3. Cores fixas por grupamento — mesmas nas duas abas.**
```js
var CORES_MUSCULOS = {
  'Quadríceps': '#378ADD',
  'Glúteo':     '#1D9E75',
  'Posterior':  '#EF9F27',
  'Costas':     '#7F77DD',
  'Peitoral':   '#D85A30',
  'Ombro':      '#D4537E',
  'Bíceps':     '#5DCAA5',
  'Tríceps':    '#AFA9EC',
  'Lombar':     '#B4B2A9',
  'Adutores':   '#97C459',
  'Panturrilha':'#888780'
};
```

**4. Wrapper do canvas com height explícita — nunca no canvas.**
```html
<div style="position:relative; height:220px; width:100%">
  <canvas id="meuChart"></canvas>
</div>
```

**5. Sempre destroy() antes de recriar o gráfico.**
```js
if (chartT) { chartT.destroy(); chartT = null; }
chartT = new Chart(...);
```

**6. Pills de treino: ativa = fundo na cor do treino.**
```js
// pill ativa:
pill.style.background = treino.cor;
pill.style.borderColor = treino.cor;
pill.style.color = '#fff';
// pill inativa:
pill.style.background = 'transparent';
```

**7. Eixo Y: apenas inteiros, sem decimais.**
```js
ticks: {
  stepSize: 1,
  callback: function(v) { return Number.isInteger(v) ? v : ''; }
}
```

---

## Prompt para o Cursor

```
Preciso que a tela de Volumes do app siga exatamente o layout e comportamento
do arquivo volume-prototype.html. Abra e teste no browser antes de implementar.

CONTEXTO:
Esta tela já está dentro da aba de um aluno específico.
Não há seletor de aluno. Não há toggle de comparação. Não há histograma de dias.

ESTRUTURA OBRIGATÓRIA:
- Tabs sticky no topo: "Por treino" | "Por semana"
- Por treino: pills de sessão → clicar atualiza o gráfico → 1 KPI (séries da sessão) → gráfico
- Por semana: 1 KPI (séries da semana) → gráfico

REGRAS TÉCNICAS:
1. Volume = número de séries realizadas. Nunca peso × reps.
2. Gráfico Chart.js type:'bar' (barras VERTICAIS). Eixo X = grupamentos, Y = séries.
3. Cores fixas por grupamento (ver CORES_MUSCULOS no protótipo). Mesmas nas duas abas.
4. Wrapper do canvas: position:relative + height:220px. Nunca setar height no canvas.
5. Sempre fazer chartT.destroy() antes de recriar o gráfico.
6. Pill de treino ativa: background = cor do treino. Inativa: transparente.
7. Eixo Y: somente inteiros. ticks.stepSize=1, callback filtrando não-inteiros.
8. Preservar toda lógica Firebase. Não tocar em salvarRegistro().
   Séries por grupamento: cruzar registros do aluno com campo de grupamentos
   cadastrado em cada exercício no Firestore.

Use volume-prototype.html como referência visual exata.
```
