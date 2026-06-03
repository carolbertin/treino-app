/**
 * planilhaParser.js
 * Lê a planilha do personal e retorna dados estruturados prontos pro Firebase.
 *
 * Dependência: SheetJS — npm install xlsx
 * ou CDN: <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
 */

import * as XLSX from "xlsx";

const DESCANSO_PADRAO = "Feeder/aquecimento: 90s | Work set: >2min";

// ─── FUNÇÃO PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Recebe um File (.xlsx) e retorna array de treinos estruturados.
 * @param {File} file
 * @returns {Promise<Array>}
 */
export async function parsePlanilha(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const treinos = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    // Ignora abas que não parecem ser de treino
    if (!isAbaDeTreino(rows)) continue;

    const exercicios = parseExercicios(rows);
    const substituicoes = parseSubstituicoes(rows);
    const exerciciosFinais = mergeSubstitutos(exercicios, substituicoes);

    treinos.push({
      nome: sheetName,
      descanso: DESCANSO_PADRAO,
      exercicios: exerciciosFinais,
    });
  }

  return treinos;
}

// ─── DETECÇÃO AUTOMÁTICA DE ABA ───────────────────────────────────────────────

/**
 * Testa se uma aba é de treino verificando se tem o padrão esperado:
 * - Pelo menos uma linha com URL na col A
 * - Pelo menos uma linha com "set" na col B (feeder set / work set)
 * - Pelo menos uma linha com prescrição na col D (ex: "2x 10")
 *
 * Isso funciona independente do nome da aba.
 */
function isAbaDeTreino(rows) {
  let temURL    = false;
  let temTipo   = false;
  let temPresc  = false;

  for (let i = 2; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    if (isURL(String(row[0] || ""))) temURL = true;
    if (/set/i.test(String(row[1] || "")))   temTipo = true;
    if (/\dx\s*[\d\-+]/i.test(String(row[3] || ""))) temPresc = true;

    if (temURL && temTipo && temPresc) return true;
  }

  return false;
}

// ─── PARSE EXERCÍCIOS ─────────────────────────────────────────────────────────

function parseExercicios(rows) {
  const exercicios = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];

    if (isLinhaDeSubstituicao(row)) break;

    const video     = String(row[0] || "").trim();
    const tipoRaw   = String(row[1] || "").trim();
    const exercicio = String(row[2] || "").trim();
    const prescricao= String(row[3] || "").trim();

    if (!exercicio || !tipoRaw) continue;
    if (isLinhaIgnorada(tipoRaw, exercicio)) continue;

    const tipo = normalizaTipo(tipoRaw);
    const { series, repeticoes, rir } = parsePrescricao(prescricao);

    exercicios.push({
      exercicio,
      video:           isURL(video) ? video : "",
      tipo,
      series,
      repeticoes,
      rir,
      descanso:        DESCANSO_PADRAO,
      substituto:      "",
      videoSubstituto: "",
    });
  }

  return exercicios;
}

// ─── PARSE SUBSTITUIÇÕES ──────────────────────────────────────────────────────

function parseSubstituicoes(rows) {
  const substituicoes = [];
  let inSub = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (isLinhaDeSubstituicao(row)) {
      inSub = true;
      continue;
    }

    if (!inSub) continue;

    // Suporta dois layouts de substituição encontrados nas planilhas:
    //
    // Layout A (planilha antiga): cols 4=original, 5=substituto, 6=vídeo
    // Layout B (planilha nova):   cols 4=original, 6=substituto, 8=vídeo
    //
    // Tenta Layout B primeiro (mais comum); cai no A se não encontrar.
    const blocos = [
      { orig: row[4],  sub: row[6],  vid: row[8]  },  // Layout B — bloco 1
      { orig: row[4],  sub: row[5],  vid: row[6]  },  // Layout A — bloco 1
      { orig: row[8],  sub: row[9],  vid: row[10] },  // Layout A — bloco 2
      { orig: row[12], sub: row[13], vid: row[14] },  // Layout A — bloco 3
    ];

    for (const bloco of blocos) {
      const original   = String(bloco.orig || "").trim();
      const substituto = String(bloco.sub  || "").trim()
                           .replace(/^por\s+/i, "").trim();
      const videoSub   = String(bloco.vid  || "").trim();

      if (original && substituto && substituto !== original) {
        substituicoes.push({
          original:        original.toLowerCase(),
          substituto,
          videoSubstituto: isURL(videoSub) ? videoSub : "",
        });
      }
    }
  }

  return substituicoes;
}

// ─── MERGE ────────────────────────────────────────────────────────────────────

function mergeSubstitutos(exercicios, substituicoes) {
  return exercicios.map((ex) => {
    const nome = ex.exercicio.toLowerCase();
    const match = substituicoes.find(
      (s) => nome.includes(s.original) || s.original.includes(nome)
    );
    if (match) {
      return { ...ex, substituto: match.substituto, videoSubstituto: match.videoSubstituto };
    }
    return ex;
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * '2x 7-9 (0RIR)' → { series: 2, repeticoes: '7-9', rir: '0' }
 * '1x 4+4+4'      → { series: 1, repeticoes: '4+4+4', rir: null }
 */
function parsePrescricao(prescricao) {
  const mSeries = prescricao.match(/(\d+)\s*[xX]\s*([\d\-+]+)/);
  const mRIR    = prescricao.match(/\((\d+)\s*RIR\)/i);

  return {
    series:     mSeries ? parseInt(mSeries[1]) : null,
    repeticoes: mSeries ? mSeries[2] : prescricao || "—",
    rir:        mRIR    ? mRIR[1]    : null,
  };
}

/**
 * Remove sufixo numérico de ordem:
 * "Work set (2)" → "Work set"
 * "Feeder set (1)" → "Feeder set"
 * "Work set - cluster set" → mantém
 */
function normalizaTipo(tipo) {
  return tipo.replace(/\s*\(\d+\)\s*$/, "").trim();
}

function isLinhaDeSubstituicao(row) {
  return row && Object.values(row).some((v) =>
    /substitu/i.test(String(v))
  );
}

function isLinhaIgnorada(tipo, exercicio) {
  const ignorados = ["exercícios", "isa -", "inferior", "superior", "fullbody", "data"];
  const texto = (tipo + exercicio).toLowerCase();
  return ignorados.some((i) => texto.includes(i));
}

function isURL(str) {
  return /^https?:\/\//.test(str);
}

// ─── FIREBASE ─────────────────────────────────────────────────────────────────

/**
 * Salva os treinos no Firestore.
 * @param {Array}  treinos  — resultado de parsePlanilha()
 * @param {Object} db       — instância getFirestore()
 * @param {string} userId   — UID do usuário autenticado
 */
export async function salvarTreinosNoFirebase(treinos, db, userId) {
  const { doc, setDoc, collection } = await import("firebase/firestore");

  for (const treino of treinos) {
    const ref = doc(collection(db, "users", userId, "treinos"), treino.nome);
    await setDoc(ref, {
      nome:         treino.nome,
      descanso:     treino.descanso,
      exercicios:   treino.exercicios,
      atualizadoEm: new Date().toISOString(),
    });
  }

  console.log(`✅ ${treinos.length} treinos salvos no Firebase.`);
}
