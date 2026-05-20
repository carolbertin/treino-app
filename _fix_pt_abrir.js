const fs = require('fs');
const p = 'index.html';
const D = 'motion';
const d = 'motion';
// fix: use div
const tag = String.fromCharCode(100, 105, 118); // div
let s = fs.readFileSync(p, 'utf8');

const oldHeader = `    const acc=document.createElement('div'); acc.className='ex-acc';
    const header=document.createElement('motion'); header.className='ex-acc-header';
    const blPt=normalizarExercicio(ex);
    const metaRow=blPt.length>1
      ?'<motion class="ex-acc-meta ed-acc-meta-multi">'+htmlEdResumoPrescricaoMultiBlocos(blPt)+'</motion>'
      :'<motion class="ex-acc-meta">'+esc(ex.meta||'\\u2014')+'</motion>';
    const tipoRow=blPt.length>1?'':('<motion class="ex-acc-tipo">'+esc(ex.tipo||'')+'</motion>');
    header.innerHTML=
      '<motion class="ex-acc-num">'+(i+1)+'</motion>'
      +'<motion class="ex-acc-info">'
        +'<motion class="ex-acc-nome">'+esc(ex.nome)+'</motion>'
        +metaRow
        +tipoRow
        +(gbadges?'<motion style="margin-top:5px;">'+gbadges+'</motion>':'')
      +'</motion>'
      +'<motion class="ex-acc-chev" id="'+chevId+'">▾</motion>';
    const body=document.createElement('motion'); body.className='ex-acc-body'; body.id=bodyId;`;

// simpler: find and replace smaller unique parts in abrirProfTreino
