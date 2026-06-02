const fs = require('fs');
const p = 'index.html';
let s = fs.readFileSync(p, 'utf8');
const D = 'div';

s = s.replace(/<motion/g, '<' + D).replace(/<\/motion>/g, '</' + D + '>');
s = s.replace(
  /data-prof-meta-gerada title="Meta gerada"/g,
  'data-prof-meta-gerada hidden title="Meta gerada (debug)"'
);

const fnNew = `function htmlProfBlocoHead(b,bi,blLen,useV1){
  const tecDs=profBlocoTecnicaDataset(b);
  const titulo=profBlocoTituloPedagogico(tecDs);
  const toolbar='<${D} class="prof-bloco-toolbar">'
    +'<button type="button" class="btn-ghost" data-action="bloco-up" data-bi="'+bi+'"'+(bi===0?' disabled':'')+' title="Mover para cima">\\u2191</button>'
    +'<button type="button" class="btn-ghost" data-action="bloco-down" data-bi="'+bi+'"'+(bi===blLen-1?' disabled':'')+' title="Mover para baixo">\\u2193</button>'
    +'<button type="button" class="btn-ghost" data-action="bloco-del" data-bi="'+bi+'" style="color:var(--danger);" title="Remover bloco">\\u2715</button>'
  +'</${D}>';
  if(useV1){
    return'<${D} class="prof-bloco-head prof-bloco-head--v1">'
      +'<${D} class="prof-bloco-head-main">'
        +'<span class="prof-bloco-pill">Bloco '+(bi+1)+'</span>'
        +'<span class="prof-bloco-ico" aria-hidden="true">'+profBlocoIconoTecnica(tecDs)+'</span>'
        +'<${D} class="prof-bloco-head-text">'
          +'<span class="prof-bloco-head-title" data-prof-bloco-titulo>'+esc(titulo)+'</span>'
          +'<${D} class="prof-bloco-head-tec-wrap">'+htmlTecnicaSelect(b,bi,true)+'</${D}>'
        +'</${D}>'
      +'</${D}>'
      +toolbar
    +'</${D}>';
  }
  return'<${D} class="prof-bloco-head">'
    +'<${D} class="prof-bloco-head-main">'
      +'<span class="prof-bloco-pill">Bloco '+(bi+1)+'</span>'
      +'<span class="prof-bloco-head-title" data-prof-bloco-titulo>'+esc(titulo)+'</span>'
      +'<span class="prof-bloco-head-sep" aria-hidden="true">\\u00b7</span>'
      +'<${D} class="prof-bloco-head-tec-wrap">'+htmlTecnicaSelect(b,bi,true)+'</${D}>'
    +'</${D}>'
    +toolbar
  +'</${D}>';
}
`;

const i0 = s.indexOf('function htmlProfBlocoHead(b,bi,blLen){');
const i1 = s.indexOf('function htmlBlocosEditor(ex)', i0);
if (i0 < 0 || i1 < 0) throw new Error('htmlProfBlocoHead bounds not found');
s = s.slice(0, i0) + fnNew + s.slice(i1);

s = s.replace('+htmlProfBlocoHead(b,bi,bl.length)', '+htmlProfBlocoHead(b,bi,bl.length,useV1)');

const p0 = s.indexOf("          +'<motion class=\"prof-bloco-preview-wrap\">");
if (p0 < 0) {
  const alt = s.indexOf("          +'<div class=\"prof-bloco-preview-wrap\">");
  if (alt < 0) throw new Error('preview wrap not found');
}
const pStart = s.indexOf("          +'<div class=\"prof-bloco-preview-wrap\">");
const pEnd = s.indexOf("            +'<summary class=\"prof-bloco-nota-sum\">Nota ao aluno (opcional)</summary>'", pStart);
if (pStart < 0 || pEnd < 0) throw new Error('preview section bounds not found');

const previewBlockNew = `          +(useV1?htmlProfPreviewV1(bi):htmlProfPreviewLegado(bi))
          +'<details class="prof-bloco-nota'+(useV1?' prof-bloco-nota--toggle':'')+'"'+(((b.obs||'')+'').trim()?' open':'')+'>'
            +'<summary class="prof-bloco-nota-sum">Nota ao aluno (opcional)</summary>'`;

// replace from preview wrap through details open line - keep prescreve line before
const presEnd = s.lastIndexOf("+notacao+'</motion>'", pStart);
const presEnd2 = s.lastIndexOf("+notacao+'</div>'", pStart);
const pe = Math.max(presEnd, presEnd2);
if (pe < 0) throw new Error('prescreve end not found');
s = s.slice(0, pStart) + previewBlockNew + s.slice(pEnd);

const previewFnOld = `  if(elS){
    if(steps){
      elS.textContent='';
      elS.style.display='none';
    }else{
      const multiSub=profMetaPreviewSubMulti(tecnica,meta);
      const sub=((multiSub||tt.sub||'')+'').trim();
      elS.textContent=sub;
      elS.style.display=sub?'':'none';
    }
  }
}`;

const previewFnNew = `  const isV1=blocoEditorEl.classList&&blocoEditorEl.classList.contains('prof-bloco-editor--v1');
  const elH=root.querySelector('[data-prof-aluno-humano]');
  if(isV1&&elH){
    const linhas=profReadLinhasFromBlocoEl(blocoEditorEl,tecnica);
    const prev=profPreviewHumanoAluno(tecnica,linhas);
    if(elT)elT.style.display='none';
    if(elSteps){elSteps.innerHTML='';elSteps.style.display='none';}
    if(elS){elS.textContent='';elS.style.display='none';}
    if(prev.text){
      elH.innerHTML=profRenderPreviewHumanoHtml(prev);
      elH.style.display='';
    }else{
      elH.textContent='Preencha as linhas acima para ver o preview.';
      elH.style.display='';
    }
    return;
  }
  if(elS){
    if(steps){
      elS.textContent='';
      elS.style.display='none';
    }else{
      const multiSub=profMetaPreviewSubMulti(tecnica,meta);
      const sub=((multiSub||tt.sub||'')+'').trim();
      elS.textContent=sub;
      elS.style.display=sub?'':'none';
    }
  }
}`;

if (!s.includes(previewFnOld)) throw new Error('previewFnOld not found');
s = s.replace(previewFnOld, previewFnNew);

s = s.replace(
  `      const titEl=blocoEl.querySelector('[data-prof-bloco-titulo]');
      if(titEl)titEl.textContent=profBlocoTituloPedagogico(val);
      profAtualizarPreviewBloco(blocoEl);`,
  `      const titEl=blocoEl.querySelector('[data-prof-bloco-titulo]');
      if(titEl)titEl.textContent=profBlocoTituloPedagogico(val);
      const icoEl=blocoEl.querySelector('.prof-bloco-ico');
      if(icoEl)icoEl.textContent=profBlocoIconoTecnica(val);
      profAtualizarPreviewBloco(blocoEl);`
);

if (!s.includes('profSyncDebugEditorClass();')) {
  s = s.replace(
    'window.selfTestPrescricaoLayer=selfTestPrescricaoLayer;',
    'window.selfTestPrescricaoLayer=selfTestPrescricaoLayer;\nwindow.profPreviewHumanoAluno=profPreviewHumanoAluno;\nprofSyncDebugEditorClass();'
  );
}

fs.writeFileSync(p, s);
console.log('patch complete');
