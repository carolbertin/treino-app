/**
 * professor-prototype.js
 * ========================
 * Comportamento do painel do professor — referência.
 *
 * COMO LER ESTE ARQUIVO:
 * Cada seção tem comentários separando DADOS, PARSER, RENDER e AÇÕES.
 * No app real (index.html), as funções de PARSER são puras e podem ser
 * adicionadas diretamente. As funções de RENDER substituem criarCardExercicio().
 * As funções de AÇÕES são análogas às que já existem no app.
 *
 * ÍNDICE:
 * 1. Paleta de cores dos exercícios
 * 2. Constantes de tipos e hints
 * 3. Parser — extractTokens() e parse()
 * 4. Helpers do parser
 * 5. Render do preview (interpretado como / o aluno vê)
 * 6. Dados de exercícios (estado local)
 * 7. Render principal
 * 8. Render do card de exercício
 * 9. Atualização ao vivo (sem re-render completo)
 * 10. Bi-set — vinculação entre exercícios
 * 11. Ações básicas (toggle, add, remove)
 * 12. Utilitários
 */


/* ═══════════════════════════════════════════════════════════════════════
   1. PALETA DE CORES DOS EXERCÍCIOS
   ═══════════════════════════════════════════════════════════════════════
   Cada exercício recebe uma cor em ordem circular.
   A mesma cor vai em:
     - border-left do .ex-card
     - background e color do .ex-num
     - border-left de todos os .block-card filhos

   Isso cria o vínculo visual entre exercício e seus blocos,
   sem precisar de rótulos extras.
*/
var PALETTE = [
  { border:'#378ADD', numBg:'#E6F1FB', numText:'#0C447C', blockBorder:'#85B7EB' },
  { border:'#1D9E75', numBg:'#E1F5EE', numText:'#085041', blockBorder:'#5DCAA5' },
  { border:'#EF9F27', numBg:'#FAEEDA', numText:'#633806', blockBorder:'#FAC775' },
  { border:'#7F77DD', numBg:'#EEEDFE', numText:'#3C3489', blockBorder:'#AFA9EC' },
  { border:'#D85A30', numBg:'#FAECE7', numText:'#712B13', blockBorder:'#F0997B' },
];


/* ═══════════════════════════════════════════════════════════════════════
   2. CONSTANTES DE TIPOS E HINTS
   ═══════════════════════════════════════════════════════════════════════ */

var TYPES = ['feeder', 'work', 'cluster', 'restpause', 'backoff', 'dropset'];

var TYPE_LABELS = {
  feeder:    'Feeder set',
  work:      'Work set',
  cluster:   'Cluster set',
  restpause: 'Rest-pause',
  backoff:   'Back-off',
  dropset:   'Drop set',
};

/**
 * Hints de formato esperado por técnica.
 * Aparece no campo vazio como placeholder e abaixo do campo como ajuda.
 * O parser é tolerante — esses são exemplos, não formatos rígidos.
 */
var TYPE_HINTS = {
  feeder:    '2x10 (2RIR)  ou  2x8-10 (1RIR)',
  work:      '1x8  ou  2x6-9 (0RIR)',
  cluster:   '1x4+4+4 (15 seg entre)',
  restpause: '1x8 (15 seg) +99  ou  2x7-9 (15seg, +4/5) (0RIR)',
  backoff:   '1x8 (-30%, 40 seg) +99  ou  1x7-9 (-20%, 30seg, +4/5) (0RIR)',
  dropset:   '1x6-7 (0RIR) / 10 seg / -20% / 99 reps',
};


/* ═══════════════════════════════════════════════════════════════════════
   3. PARSER — FUNÇÕES PURAS
   ═══════════════════════════════════════════════════════════════════════
   PRINCÍPIO: parser por intenção, não por regex rígido.

   O professor digita no formato que usa na planilha.
   O parser extrai tokens independente de ordem ou espaçamento.
   O TIPO selecionado (feeder/work/etc.) define como os tokens são usados.

   Exemplo: "1x8 (-30%, 40 seg) +99" e "1x8 (40 seg, -30%) +99"
   produzem o mesmo resultado — o parser encontra os tokens onde estiverem.

   ESSAS FUNÇÕES SÃO PURAS: sem efeitos colaterais, sem DOM.
   Podem ser adicionadas ao index.html sem conflito com o código existente.
   Convivem com interpretarPrescricao() — não a substituem.
*/

/**
 * extractTokens(s)
 * Extrai tokens de uma string de notação.
 * Retorna um objeto com os valores encontrados.
 * Valores não encontrados ficam undefined.
 */
function extractTokens(s) {
  var t = {};
  s = (s || '').replace(/\s+/g, ' ').trim();

  // Séries × reps: "2x10", "1x6-9", "2 x 8"
  // Aceita número fixo ou range (6-9)
  var sr = s.match(/(\d+)\s*x\s*([\d]+-[\d]+|[\d]+)/i);
  if (sr) {
    t.series = +sr[1];
    var rp = sr[2];
    var rg = rp.match(/(\d+)-(\d+)/);
    if (rg) {
      t.repsMin = +rg[1];
      t.repsMax = +rg[2];
      t.repsStr = rg[1] + '–' + rg[2];
    } else {
      t.repsMin = t.repsMax = +rp;
      t.repsStr = rp;
    }
  }

  // Blocos de cluster: "4+4+4" ou "5+5+5+5"
  var cb = s.match(/(\d+)\+(\d+)\+(\d+)(?:\+(\d+))?/);
  if (cb) {
    t.cluster = [cb[1], cb[2], cb[3]];
    if (cb[4]) t.cluster.push(cb[4]);
  }

  // RIR: "(0RIR)", "(2RIR)", "(1 RIR)"
  var rir = s.match(/\((\d+)\s*rir\)/i);
  if (rir) t.rir = +rir[1];

  // Percentual de redução: "-20%", "- 30 %"
  var pct = s.match(/-\s*(\d+)\s*%/);
  if (pct) t.dropPct = +pct[1];

  // Segundos: "15 seg", "40seg", "20s"
  var rest = s.match(/(\d+)\s*seg/i);
  if (rest) t.restSec = +rest[1];

  // Descanso do cluster: "15 seg entre", "15/20 seg entre"
  var cr = s.match(/(\d+)(?:\/(\d+))?\s*seg\s*entre/i);
  if (cr) t.clusterRest = cr[1] + (cr[2] ? '–' + cr[2] : '') + 's';

  // Continuação range: "+4/5" → contMin=4, contMax=5
  var cRange = s.match(/\+\s*(\d+)\s*[\/]\s*(\d+)/);
  if (cRange) {
    t.contMin = +cRange[1];
    t.contMax = +cRange[2];
    t.contStr = cRange[1] + '/' + cRange[2];
  } else {
    // +99 = falha máxima (código do professor na planilha)
    var c99 = s.match(/\+\s*99/);
    if (c99) {
      t.cont99 = true;
    } else {
      var cn = s.match(/\+\s*(\d+)/);
      if (cn) { t.contMin = t.contMax = +cn[1]; t.contStr = cn[1]; }
    }
  }

  return t;
}

/**
 * parse(notation, type)
 * Interpreta a notação de acordo com o tipo de bloco.
 * Retorna:
 *   { ok: true,  interp: string, steps: string[] } — reconhecido
 *   { ok: false, hint: string }                    — não reconhecido
 *   null                                           — campo vazio
 */
function parse(notation, type) {
  var s = (notation || '').trim();
  if (!s) return null;

  var t = extractTokens(s);

  // ── FEEDER SET e WORK SET ──────────────────────────────────────────
  if (type === 'feeder' || type === 'work') {
    if (!t.series || !t.repsStr) {
      return { ok: false, hint: 'Use: ' + TYPE_HINTS[type] };
    }
    var rt = rirText(t.rir);
    var interp = t.series + 'x' + t.repsStr + (t.rir != null ? ' (' + t.rir + ' RIR)' : '');
    var steps = [];

    if (type === 'feeder') {
      // Feeder set → "Série de preparação" para o aluno
      steps.push('Série de preparação · ' + repsAluno(t) + (t.series > 1 ? ' × ' + t.series : ''));
    } else {
      steps.push(t.series + ' série' + (t.series > 1 ? 's' : '') + ' · ' + repsAluno(t));
    }
    if (rt) steps.push(rt);

    return { ok: true, interp: interp, steps: steps };
  }

  // ── CLUSTER SET ────────────────────────────────────────────────────
  if (type === 'cluster') {
    if (!t.cluster) {
      return { ok: false, hint: 'Use: 1x4+4+4 (15 seg entre)' };
    }
    var tr = t.clusterRest || '15s (padrão)';
    var interp = '1x(' + t.cluster.join('+') + ') · ' + tr + ' entre mini-séries';
    return {
      ok: true,
      interp: interp,
      steps: [
        t.cluster.length + ' mini-séries de ' + t.cluster[0] + ' reps cada',
        'Descanse ' + tr + ' entre cada mini-série',
        'Mesmo peso em todas',
      ],
    };
  }

  // ── REST-PAUSE ─────────────────────────────────────────────────────
  if (type === 'restpause') {
    if (!t.series || !t.repsStr) {
      return { ok: false, hint: 'Use: ' + TYPE_HINTS[type] };
    }
    var rt = rirText(t.rir);
    var rs = t.restSec ? t.restSec + 's' : '?s';
    return {
      ok: true,
      interp: t.series + 'x' + t.repsStr + ' → ' + rs + ' → ' + (t.contStr || 'falha') + (t.rir != null ? ' (' + t.rir + ' RIR)' : ''),
      steps: [
        '① ' + t.series + ' série' + (t.series > 1 ? 's' : '') + ' · ' + repsAluno(t) + (rt ? ' · ' + rt.toLowerCase() : ''),
        '② Descanse ' + (t.restSec ? t.restSec + ' segundos' : 'os segundos prescritos'),
        '③ Continue — ' + contAluno(t),
      ],
    };
  }

  // ── BACK-OFF ───────────────────────────────────────────────────────
  // Lógica: série principal → reduz carga → descansa → continua
  if (type === 'backoff') {
    if (!t.series || !t.repsStr) {
      return { ok: false, hint: 'Use: ' + TYPE_HINTS[type] };
    }
    var rt = rirText(t.rir);
    return {
      ok: true,
      interp: t.series + 'x' + t.repsStr
        + ' → ' + (t.dropPct ? '-' + t.dropPct + '%' : 'redução')
        + ' → ' + (t.restSec ? t.restSec + 's' : '?s')
        + ' → ' + (t.contStr || 'falha')
        + (t.rir != null ? ' (' + t.rir + ' RIR)' : ''),
      steps: [
        '① ' + t.series + ' série' + (t.series > 1 ? 's' : '') + ' · ' + repsAluno(t) + (rt ? ' · ' + rt.toLowerCase() : ''),
        '② Reduza ' + (t.dropPct ? t.dropPct + '%' : 'a carga prescrita'),
        '③ Descanse ' + (t.restSec ? t.restSec + ' segundos' : 'os segundos prescritos'),
        '④ Continue — ' + contAluno(t),
      ],
    };
  }

  // ── DROP SET ────────────────────────────────────────────────────────
  // Diferença do back-off: pausa é brevíssima (10s), sem número de reps na continuação
  if (type === 'dropset') {
    if (!t.series || !t.repsStr) {
      return { ok: false, hint: 'Use: ' + TYPE_HINTS[type] };
    }
    var rt = rirText(t.rir);
    return {
      ok: true,
      interp: t.series + 'x' + t.repsStr
        + ' → ' + (t.restSec ? t.restSec + 's' : 'mínimo')
        + ' → ' + (t.dropPct ? '-' + t.dropPct + '%' : 'redução')
        + ' → falha'
        + (t.rir != null ? ' (' + t.rir + ' RIR)' : ''),
      steps: [
        '① ' + t.series + ' série' + (t.series > 1 ? 's' : '') + ' · ' + repsAluno(t) + (rt ? ' · ' + rt.toLowerCase() : ''),
        '② Descanse ' + (t.restSec ? t.restSec + ' segundos' : 'brevemente'),
        '③ Reduza ' + (t.dropPct ? t.dropPct + '%' : 'a carga prescrita'),
        '④ Vá até a falha — registre o total',
      ],
    };
  }

  return null;
}


/* ═══════════════════════════════════════════════════════════════════════
   4. HELPERS DO PARSER
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Texto de instrução de RIR para o aluno.
 * 0 RIR → "Vá até o limite" (não "Pare 0 reps antes da falha")
 */
function rirText(r) {
  if (r === undefined || r === null) return null;
  if (r === 0) return 'Vá até o limite';
  return 'Pare ' + r + ' rep' + (r > 1 ? 's' : '') + ' antes da falha';
}

/** Texto de reps para o aluno — número fixo ou range */
function repsAluno(t) {
  if (t.repsMin === t.repsMax) return t.repsStr + ' reps';
  return 'de ' + t.repsMin + ' a ' + t.repsMax + ' reps';
}

/** Texto de continuação para o aluno */
function contAluno(t) {
  if (t.cont99) return 'vá até a falha — registre o total';
  if (t.contStr) {
    if (t.contMin === t.contMax) return 'mais ' + t.contMin + ' reps — registre o total';
    return 'mais ' + t.contMin + ' a ' + t.contMax + ' reps — registre o total';
  }
  return 'continue — registre o total';
}


/* ═══════════════════════════════════════════════════════════════════════
   5. RENDER DO PREVIEW
   ═══════════════════════════════════════════════════════════════════════
   Retorna HTML do feedback ao vivo.
   Chamado a cada keystroke — deve ser rápido.
*/

/**
 * renderPreview(p, type)
 * p = resultado de parse()
 * Retorna string HTML para injetar no elemento #prev_*
 */
function renderPreview(p, type) {
  if (!p) return '';

  // Não reconhecido: caixa vermelha com hint
  if (!p.ok) {
    return '<div class="preview err">'
      + '<div class="preview-tag err">Não reconhecido</div>'
      + '<div class="preview-step" style="color:#A32D2D">' + p.hint + '</div>'
      + '</div>';
  }

  // Reconhecido: duas camadas — interpretado como + o aluno verá
  var stepsHtml = p.steps.map(function(s) {
    return '<div class="preview-step">' + s + '</div>';
  }).join('');

  return '<div class="preview ok">'
    + '<div class="preview-tag ok">Interpretado como</div>'
    + '<div class="preview-interp">' + p.interp + '</div>'
    + '<div class="preview-aluno-lbl">'
    + '<i class="ti ti-user" style="font-size:10px" aria-hidden="true"></i>'
    + ' O aluno verá:</div>'
    + stepsHtml
    + '</div>';
}


/* ═══════════════════════════════════════════════════════════════════════
   6. DADOS DE EXERCÍCIOS
   ═══════════════════════════════════════════════════════════════════════
   Estado local do editor.

   No app real, esta estrutura vive em editorExercicios[].
   O campo 'notation' mapeia para 'meta' ao salvar no Firestore.
   O campo 'bisetWith' é novo — id do exercício par (ou null).
*/
var exercises = [
  {
    id: 1, open: true, name: 'Cadeira flexora (normal)',
    yt: 'https://youtube.com/watch?v=YLJJJYOfSfc',
    obs: 'Manter pé flexionado durante todo o movimento.',
    detailsOpen: false, subs: [], bisetWith: null,
    blocks: [
      { type: 'feeder',  notation: '2x10 (2RIR)' },
      { type: 'work',    notation: '2x6-9 (0RIR)' },
      { type: 'backoff', notation: '1x8 (-30%, 40 seg) +99' },
    ],
  },
  {
    id: 2, open: false, name: 'Puxador aberto supinado',
    yt: '', obs: '', detailsOpen: false, subs: [], bisetWith: null,
    blocks: [
      { type: 'feeder',    notation: '1x10 (2RIR)' },
      { type: 'work',      notation: '2x8' },
      { type: 'restpause', notation: '1x8 (15 seg) +99' },
    ],
  },
  {
    id: 3, open: false, name: 'Cadeira extensora bilateral',
    yt: '', obs: '', detailsOpen: false, subs: [{ name: 'Leg press 45°' }], bisetWith: null,
    blocks: [
      { type: 'feeder',  notation: '1x10 (2RIR)' },
      { type: 'work',    notation: '2x8' },
      { type: 'cluster', notation: '1x4+4+4 (15 seg entre)' },
    ],
  },
  {
    id: 4, open: false, name: 'Rosca direta',
    yt: '', obs: '', detailsOpen: false, subs: [], bisetWith: 5,
    blocks: [
      { type: 'feeder', notation: '1x10 (2RIR)' },
      { type: 'work',   notation: '2x6-9 (0RIR)' },
    ],
  },
  {
    id: 5, open: false, name: 'Tríceps testa',
    yt: '', obs: '', detailsOpen: false, subs: [], bisetWith: 4,
    blocks: [
      { type: 'feeder',  notation: '1x10 (2RIR)' },
      { type: 'work',    notation: '2x8' },
      { type: 'dropset', notation: '1x6-7 (0RIR) / 10 seg / -20% / 99 reps' },
    ],
  },
];

var nextId = 6;

/**
 * linkingMode: id do exercício aguardando vinculação bi-set.
 * null = modo normal.
 */
var linkingMode = null;


/* ═══════════════════════════════════════════════════════════════════════
   7. RENDER PRINCIPAL
   ═══════════════════════════════════════════════════════════════════════
   Reconstrói a lista de exercícios do zero.
   Chamado após qualquer mudança de estado estrutural
   (toggle, add/remove exercício, set de tipo, toggle bi-set).

   EXCEÇÃO: liveNotation() atualiza apenas os elementos afetados
   sem chamar render() para preservar o foco do input.
*/
function render() {
  var html = '';
  var rendered = new Set();

  // Banner de modo de vinculação
  if (linkingMode !== null) {
    var lEx = exercises.find(function(e) { return e.id === linkingMode; });
    html += '<div class="link-mode-banner">'
      + '<i class="ti ti-link" style="font-size:15px" aria-hidden="true"></i>'
      + 'Selecione outro exercício para vincular em bi-set com <strong>'
      + (lEx ? esc(lEx.name) : '') + '</strong>'
      + '<button class="link-cancel-btn" onclick="linkingMode=null;render()">Cancelar</button>'
      + '</div>';
  }

  exercises.forEach(function(ex, ei) {
    if (rendered.has(ei)) return;

    var p = PALETTE[ei % PALETTE.length];
    var pairIdx = ex.bisetWith
      ? exercises.findIndex(function(e) { return e.id === ex.bisetWith; })
      : -1;

    html += renderExCard(ei, p);
    rendered.add(ei);

    // Se tem par bi-set ainda não renderizado, renderizar com ponte
    if (pairIdx >= 0 && !rendered.has(pairIdx)) {
      html += '<div class="biset-bridge">'
        + '<div class="biset-bridge-line"></div>'
        + '<button class="biset-badge" onclick="unlinkBiset(' + ei + ')" title="Clique para desvincular">'
        + '<i class="ti ti-link" style="font-size:12px" aria-hidden="true"></i>'
        + ' Bi-set · clique para desvincular</button>'
        + '<div class="biset-bridge-line"></div>'
        + '</div>';
      html += renderExCard(pairIdx, PALETTE[pairIdx % PALETTE.length]);
      rendered.add(pairIdx);
    }

    html += '</div>'; // fecha .ex-group (aberto em renderExCard)
  });

  document.getElementById('exList').innerHTML = html;
}


/* ═══════════════════════════════════════════════════════════════════════
   8. RENDER DO CARD DE EXERCÍCIO
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Retorna HTML completo de um card de exercício.
 * p = paleta de cor para este exercício.
 */
function renderExCard(ei, p) {
  var ex = exercises[ei];

  // Quando modo de vinculação está ativo, outros exercícios ficam clicáveis
  var isLinkTarget = (linkingMode !== null && linkingMode !== ex.id);

  var html = '<div class="ex-group">'
    + '<div class="ex-card" id="exc_' + ex.id + '"'
    + ' style="border-left-color:' + p.border + '">';

  // ── Cabeçalho colapsado ──────────────────────────────────────────
  html += '<div class="ex-collapsed"'
    + (isLinkTarget
        ? ' style="cursor:pointer" onclick="startLinking(' + ei + ')" title="Vincular em bi-set"'
        : ' onclick="toggleEx(' + ei + ')"')
    + '>';

  html += '<div class="ex-num" style="background:' + p.numBg + ';color:' + p.numText + '">' + (ei + 1) + '</div>';

  html += '<div class="ex-info">'
    + '<div class="ex-info-name">' + esc(ex.name || 'Novo exercício') + '</div>'
    + '<div class="ex-info-sub">' + blockSubtitle(ex) + '</div>'
    + '</div>';

  // Ícone de corrente — não propaga o click para o toggle
  html += '<div class="ex-actions" onclick="event.stopPropagation()">'
    + '<button class="icon-btn' + (linkingMode === ex.id ? ' link-active' : '') + '"'
    + ' onclick="startLinking(' + ei + ')" title="Vincular em bi-set" aria-label="Vincular bi-set">'
    + '<i class="ti ti-link" style="font-size:14px" aria-hidden="true"></i>'
    + '</button>'
    + '</div>';

  html += '<i class="ti ti-chevron-down ex-chevron' + (ex.open ? ' open' : '') + '" aria-hidden="true"></i>';
  html += '</div>'; // fecha .ex-collapsed

  // ── Corpo expandido ──────────────────────────────────────────────
  if (ex.open && !isLinkTarget) {
    html += '<div class="ex-body">';

    // Nome do exercício
    html += '<div class="field-label">Nome do exercício</div>'
      + '<input class="field-input" style="margin-bottom:12px"'
      + ' value="' + esc(ex.name) + '"'
      + ' placeholder="Ex: Cadeira flexora"'
      + ' oninput="exercises[' + ei + '].name=this.value;refreshMeta(' + ei + ')">';

    // Lista de blocos
    html += '<div class="blocks-label">Blocos prescritos</div>'
      + '<div class="blocks-list">';

    ex.blocks.forEach(function(blk, bi) {
      html += renderBlockCard(ex, ei, blk, bi, p);
    });

    html += '</div>'; // fecha .blocks-list

    html += '<button class="add-block-btn" onclick="addBlock(' + ei + ')">'
      + '<i class="ti ti-plus" style="font-size:13px" aria-hidden="true"></i>'
      + ' Adicionar bloco</button>';

    // Toggle de detalhes
    html += '<button class="details-toggle" onclick="toggleDetails(' + ei + ')">'
      + '<i class="ti ti-chevron-' + (ex.detailsOpen ? 'up' : 'down') + '" style="font-size:14px" aria-hidden="true"></i>'
      + (ex.detailsOpen ? 'Ocultar detalhes' : 'Vídeo, observações e substitutos')
      + '</button>';

    if (ex.detailsOpen) {
      html += '<div class="details-section">';

      html += '<div><div class="field-label">Link do vídeo (YouTube ou Drive)</div>'
        + '<input class="field-input mono" placeholder="https://..."'
        + ' value="' + esc(ex.yt || '') + '"'
        + ' oninput="exercises[' + ei + '].yt=this.value"></div>';

      // Observações — campo de textarea
      html += '<div><div class="field-label">Observações para o aluno</div>'
        + '<textarea class="field-input" rows="3"'
        + ' placeholder="Orientações, dicas de execução, pontos de atenção..."'
        + ' oninput="exercises[' + ei + '].obs=this.value">'
        + esc(ex.obs || '')
        + '</textarea></div>';

      // Substitutos
      html += '<div><div class="field-label" style="margin-bottom:6px">Substitutos</div>';
      (ex.subs || []).forEach(function(sub, si) {
        html += '<div class="sub-row">'
          + '<span class="sub-name">' + esc(sub.name) + '</span>'
          + '<button class="sub-del" onclick="removeSub(' + ei + ',' + si + ')" aria-label="Remover substituto">'
          + '<i class="ti ti-x" style="font-size:13px" aria-hidden="true"></i>'
          + '</button></div>';
      });
      html += '<button class="add-sub-btn" onclick="addSub(' + ei + ')">'
        + '<i class="ti ti-plus" style="font-size:12px;vertical-align:-1px;margin-right:4px" aria-hidden="true"></i>'
        + 'Adicionar substituto</button></div>';

      html += '</div>'; // fecha .details-section
    }

    html += '</div>'; // fecha .ex-body
  }

  html += '</div>'; // fecha .ex-card
  // Nota: .ex-group é fechado em render() após inserir a ponte de bi-set (se houver)
  return html;
}

/**
 * renderBlockCard(ex, ei, blk, bi, p)
 * Retorna HTML de um bloco individual.
 * p = paleta de cor do exercício pai (para border-left do bloco).
 */
function renderBlockCard(ex, ei, blk, bi, p) {
  var parsed = parse(blk.notation, blk.type);
  var inpCls = blk.notation ? (parsed && parsed.ok ? 'ok' : 'err') : '';

  var html = '<div class="block-card" id="blk_' + ex.id + '_' + bi + '"'
    + ' style="border-left-color:' + p.blockBorder + '">';

  // Cabeçalho do bloco: número + nome do exercício pai
  html += '<div class="block-head">'
    + '<div class="block-head-meta">'
    + '<span class="block-head-num" style="color:' + p.numText + '">Bloco ' + (bi + 1) + '</span>'
    + '<span class="block-head-exname">· ' + esc(ex.name || 'este exercício') + '</span>'
    + '</div>'
    + '<button class="block-del" onclick="removeBlock(' + ei + ',' + bi + ')" aria-label="Remover bloco">'
    + '<i class="ti ti-x" style="font-size:12px" aria-hidden="true"></i>'
    + '</button></div>';

  // Pills de tipo — NUNCA <select>
  html += '<div class="type-row">';
  TYPES.forEach(function(t) {
    var active = t === blk.type;
    html += '<button class="type-pill ' + t + (active ? '' : ' inactive') + '"'
      + ' onclick="setType(' + ei + ',' + bi + ',\'' + t + '\')">'
      + (active ? '<i class="ti ti-check" style="font-size:10px;margin-right:2px" aria-hidden="true"></i>' : '')
      + TYPE_LABELS[t] + '</button>';
  });
  html += '</div>';

  // Campo de notação + preview ao vivo
  html += '<div class="notation-wrap">'
    + '<input class="notation-inp mono ' + inpCls + '"'
    + ' placeholder="' + TYPE_HINTS[blk.type] + '"'
    + ' value="' + esc(blk.notation) + '"'
    + ' oninput="liveNotation(' + ei + ',' + bi + ',this)">'
    + '<div class="hint-txt" id="hint_' + ex.id + '_' + bi + '">'
    + (blk.notation ? '' : 'Ex: ' + TYPE_HINTS[blk.type]) + '</div>'
    + '<div id="prev_' + ex.id + '_' + bi + '">'
    + (blk.notation ? renderPreview(parsed, blk.type) : '')
    + '</div></div>';

  html += '</div>'; // fecha .block-card
  return html;
}

/**
 * blockSubtitle(ex)
 * Gera o subtítulo compacto do card colapsado.
 * Formato: "Feeder set · 2x10 (2RIR)   Work set · 2x6-9   Back-off · 1x8..."
 * Atualizado ao vivo enquanto o professor digita.
 */
function blockSubtitle(ex) {
  return ex.blocks.map(function(b) {
    var p = parse(b.notation, b.type);
    return (p && p.ok) ? TYPE_LABELS[b.type] + ' · ' + b.notation : TYPE_LABELS[b.type];
  }).join('   ');
}


/* ═══════════════════════════════════════════════════════════════════════
   9. ATUALIZAÇÃO AO VIVO
   ═══════════════════════════════════════════════════════════════════════
   PRINCÍPIO: não fazer re-render completo do card ao digitar.
   Re-render completo perde o foco do input e interrompe a digitação.
   Atualizar apenas os 3 elementos que mudam: input, hint e preview.
*/

/**
 * liveNotation(ei, bi, inp)
 * Handler do oninput do campo de notação.
 * Atualiza classe do input, hint e preview sem re-render do card.
 */
function liveNotation(ei, bi, inp) {
  var val = inp.value;
  exercises[ei].blocks[bi].notation = val;
  var type = exercises[ei].blocks[bi].type;
  var p = parse(val, type);

  // Atualiza classe do input (ok/err/vazio)
  inp.className = 'notation-inp mono ' + (val ? (p && p.ok ? 'ok' : 'err') : '');

  // Atualiza hint (só aparece quando campo está vazio)
  var h = document.getElementById('hint_' + exercises[ei].id + '_' + bi);
  if (h) h.textContent = val ? '' : 'Ex: ' + TYPE_HINTS[type];

  // Atualiza preview
  var pv = document.getElementById('prev_' + exercises[ei].id + '_' + bi);
  if (pv) pv.innerHTML = val ? renderPreview(p, type) : '';

  // Atualiza subtítulo do card colapsado (não perde foco — atualiza só o texto)
  refreshMeta(ei);
}

/**
 * refreshMeta(ei)
 * Atualiza nome e subtítulo no cabeçalho colapsado do exercício.
 * Chamado sem re-render completo.
 */
function refreshMeta(ei) {
  var el = document.getElementById('exc_' + exercises[ei].id);
  if (!el) return;
  var n = el.querySelector('.ex-info-name');
  var s = el.querySelector('.ex-info-sub');
  if (n) n.textContent = exercises[ei].name || 'Novo exercício';
  if (s) s.textContent = blockSubtitle(exercises[ei]);
}


/* ═══════════════════════════════════════════════════════════════════════
   10. BI-SET — VINCULAÇÃO ENTRE EXERCÍCIOS
   ═══════════════════════════════════════════════════════════════════════
   Bi-set NÃO é um tipo de bloco.
   É uma RELAÇÃO entre dois exercícios completos.

   FLUXO DE VINCULAÇÃO:
   1. Professor clica no ícone de corrente do exercício A
   2. linkingMode = id de A. Banner aparece, outros cards ficam clicáveis.
   3. Professor clica no card B (ou no ícone de corrente de B)
   4. A.bisetWith = B.id, B.bisetWith = A.id
   5. linkingMode = null. Render atualiza. Ponte visual aparece entre os cards.

   DESVINCULAR:
   - Clicar no badge "Bi-set · clique para desvincular"
   - A.bisetWith = null, B.bisetWith = null
*/

function startLinking(ei) {
  var exId = exercises[ei].id;

  // Clicar no mesmo que está em modo de vinculação: cancelar
  if (linkingMode === exId) {
    linkingMode = null;
    render();
    return;
  }

  // Já está em modo e clicou em outro: vincular
  if (linkingMode !== null) {
    var aIdx = exercises.findIndex(function(e) { return e.id === linkingMode; });
    var bIdx = ei;
    // Desvincular possíveis vínculos existentes antes
    if (exercises[aIdx].bisetWith) unlinkBiset(aIdx);
    if (exercises[bIdx].bisetWith) unlinkBiset(bIdx);
    // Criar vínculo bidirecional
    exercises[aIdx].bisetWith = exercises[bIdx].id;
    exercises[bIdx].bisetWith = exercises[aIdx].id;
    linkingMode = null;
    render();
    return;
  }

  // Ativar modo de vinculação
  linkingMode = exId;
  render();
}

function unlinkBiset(ei) {
  var ex = exercises[ei];
  if (!ex.bisetWith) return;
  var pairIdx = exercises.findIndex(function(e) { return e.id === ex.bisetWith; });
  if (pairIdx >= 0) exercises[pairIdx].bisetWith = null;
  ex.bisetWith = null;
  render();
}


/* ═══════════════════════════════════════════════════════════════════════
   11. AÇÕES BÁSICAS
   ═══════════════════════════════════════════════════════════════════════ */

function toggleEx(ei) {
  exercises[ei].open = !exercises[ei].open;
  render();
}

function toggleDetails(ei) {
  exercises[ei].detailsOpen = !exercises[ei].detailsOpen;
  render();
}

function setType(ei, bi, type) {
  exercises[ei].blocks[bi].type = type;
  render();
}

function addBlock(ei) {
  exercises[ei].blocks.push({ type: 'work', notation: '' });
  render();
}

function removeBlock(ei, bi) {
  if (exercises[ei].blocks.length <= 1) return; // mínimo 1 bloco
  exercises[ei].blocks.splice(bi, 1);
  render();
}

function addEx() {
  exercises.push({
    id: nextId++,
    open: true,
    name: '',
    yt: '',
    obs: '',
    detailsOpen: false,
    subs: [],
    bisetWith: null,
    blocks: [
      { type: 'feeder', notation: '' },
      { type: 'work', notation: '' },
    ],
  });
  render();
}

function addSub(ei) {
  var n = prompt('Nome do exercício substituto:');
  if (!n) return;
  if (!exercises[ei].subs) exercises[ei].subs = [];
  exercises[ei].subs.push({ name: n.trim(), yt: '' });
  render();
}

function removeSub(ei, si) {
  exercises[ei].subs.splice(si, 1);
  render();
}


/* ═══════════════════════════════════════════════════════════════════════
   12. UTILITÁRIOS
   ═══════════════════════════════════════════════════════════════════════ */

/** Escapa HTML para injeção segura de strings no DOM */
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init
render();
