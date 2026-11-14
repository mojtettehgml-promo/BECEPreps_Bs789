/* =============== textbook chapter importer (Word) =============== */
async function compressForUpload(src,maxPx=900,limit=420000){
  const w0=src.width||src.naturalWidth,h0=src.height||src.naturalHeight;
  for(const [mx,q] of [[maxPx,.8],[Math.round(maxPx*.8),.7],[640,.6],[480,.5]]){const sc=Math.min(1,mx/Math.max(w0,h0)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w0*sc));c.height=Math.max(1,Math.round(h0*sc));const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',q);if(d.length<=limit)return d}
  throw new Error('That picture is too detailed.')}
const loadImg=url=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('bad image'));i.src=url});
async function readBookDoc(file){
  await loadScript(LIBS.mammoth,()=>window.mammoth);
  const r=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{convertImage:window.mammoth.images.imgElement(im=>im.read('base64').then(b=>({src:'data:'+im.contentType+';base64,'+b})))});
  const doc=new DOMParser().parseFromString(r.value,'text/html'),images=[];let skipped=0;
  for(const im of [...doc.querySelectorAll('img')]){try{const src=im.getAttribute('src')||'';if(!/^data:image\/(png|jpeg|jpg|gif|webp)/.test(src))throw 0;const id='i'+Math.random().toString(36).slice(2,9)+images.length;images.push({id,d:await compressForUpload(await loadImg(src))});im.setAttribute('src','img:'+id)}catch(e){skipped++;im.remove()}}
  return{doc,images,skipped}}
function bookMarkup(doc){
  const out=[],clean=s=>s.replace(/[ \t ]+/g,' ').replace(/ ([,.;:!?])/g,'$1').trim();
  const inl=n=>{let s='';n.childNodes.forEach(c=>{if(c.nodeType===3)s+=c.nodeValue;else if(c.nodeType===1){const t=c.tagName.toLowerCase();if(t==='img')return;const i=inl(c);if(t==='strong'||t==='b')s+=i.trim()?'**'+i.trim()+'** ':'';else if(t==='sup')s+='^{'+i+'}';else if(t==='sub')s+='_{'+i+'}';else if(t==='br')s+=' ';else s+=i}});return s};
  const imgsIn=n=>[...n.querySelectorAll('img')].map(i=>'[[img:'+(i.getAttribute('src')||'').slice(4)+']]');
  const cellLines=c=>{const L=[];c.childNodes.forEach(x=>{if(x.nodeType!==1)return;const t=x.tagName.toLowerCase();if(t==='ul'||t==='ol')x.querySelectorAll(':scope>li').forEach(li=>{const z=clean(inl(li));if(z)L.push('- '+z)});else{const z=clean(inl(x));if(z)L.push(z)}});if(!L.length){const z=clean(inl(c));if(z)L.push(z)}return L};
  const special=(lines)=>{const f=lines[0].replace(/\*\*/g,'').trim(),rest=lines.slice(1);
    if(/^what you will learn/i.test(f)){out.push('','> 🎯 **'+f+'**',...rest.map(x=>x.startsWith('- ')?x:'- '+x),'');return}
    if(/^[A-H]\.\s+\S/.test(f)){out.push('','@@SEC '+f.replace(/\s+/g,' '),'',...rest,'');return}
    if(/^activity\b/i.test(f)){out.push('','> 🧪 **'+f+'** '+rest.map(x=>x.replace(/^- /,'')).join(' '),'');return}
    if(/^chapter summary$/i.test(f)){out.push('','@@SUMMARY','');return}
    if(/^word bank$/i.test(f)){out.push('','@@WORDS','');return}
    if(/^(revision exercises|end of chapter assessment)$/i.test(f)){out.push('','@@QUESTIONS','');return}
    if(/^teacher answer key$/i.test(f)){out.push('','@@KEY','');return}
    out.push('','> '+lines.map(x=>x.replace(/^- /,'')).join(' '),'')};
  doc.body.childNodes.forEach(n=>{if(n.nodeType!==1)return;const t=n.tagName.toLowerCase();
    if(t==='table'){const rows=[...n.querySelectorAll('tr')];const imgs=imgsIn(n);
      if(rows.length===1&&rows[0].children.length===1){const L=cellLines(rows[0].children[0]);if(imgs.length)out.push('',...imgs,'');if(L.length)special(L);return}
      const g=rows.map(tr=>[...tr.children].map(c=>clean(cellLines(c).map(x=>x.replace(/^- /,'')).join('; ')).replace(/\|/g,'/')));
      if(imgs.length)out.push('',...imgs,'');out.push('');g.forEach((r,i)=>{out.push('| '+r.join(' | ')+' |');if(i===0)out.push('|'+r.map(()=>'---').join('|')+'|')});out.push('');return}
    if(/^h[1-6]$/.test(t)){const x=clean(inl(n).replace(/\*\*/g,''));if(x)out.push('','## '+x,'');return}
    if(t==='ul'||t==='ol'){let k=(parseInt(n.getAttribute('start'))||1)-1;out.push('');n.querySelectorAll(':scope>li').forEach(li=>{const x=clean(inl(li));if(x)out.push(t==='ul'?'- '+x:(++k)+'. '+x)});out.push('');return}
    if(t==='p'){const imgs=imgsIn(n),x=clean(inl(n));if(imgs.length)out.push('',...imgs,'');if(!x)return;
      if(/^(end of chapter assessment|revision exercises)$/i.test(x)){out.push('','@@QUESTIONS','');return}if(/^teacher answer key$/i.test(x)){out.push('','@@KEY','');return}
      if(/^Part\s+\d+\b/i.test(x)){out.push('','## '+x.replace(/\*\*/g,''),'');return}
      if(/^sub ?strand/i.test(x.replace(/\*\*/g,''))){out.push('@@META '+x.replace(/\*\*/g,''));return}
      if(/^(basic\s*\d|strand\s*\d)/i.test(x.replace(/\*\*/g,''))&&wc(x)<12)return;
      out.push(x,'')}});
  return out.join('\n').replace(/\n{3,}/g,'\n\n')}
const wc=s=>(String(s).replace(/\[\[img:[^\]]*\]\]/g,' ').match(/\S+/g)||[]).length;
function bookBlocks(lines){const blocks=[];let cur=[];const fl=()=>{if(cur.length)blocks.push({t:cur.join('\n')});cur=[]};
  for(const l of lines){if(!l.trim()){fl();continue}if(/^@@SEC /.test(l)){fl();blocks.push({sec:l.slice(6).replace(/^[A-H]\.\s*/,'')});continue}
    if(/^## /.test(l)&&cur.length){fl()}cur.push(l);if(/^## /.test(l))fl()}fl();return blocks}
function microLessons(blocks,topic){
  const out=[];let cur=null,sec='',n=0;const isH=b=>b.t&&/^## /.test(b.t)&&!b.t.includes('\n');
  const begin=()=>{cur={blocks:[],w:0,sec};out.push(cur)};
  for(const b of blocks){
    if(b.sec!==undefined){sec=b.sec;if(cur&&cur.w>=70)cur=null;continue}
    const bw=wc(b.t);
    if(cur&&cur.w>=100&&(isH(b)&&cur.w>=110||cur.w+bw>260)){const last=cur.blocks[cur.blocks.length-1];if(last&&isH(last)&&cur.blocks.length>1){cur.blocks.pop();cur.w-=wc(last.t);begin();cur.blocks.push(last);cur.w+=wc(last.t)}else begin()}
    if(!cur)begin();cur.blocks.push(b);cur.w+=bw}
  const res=[];for(const m of out.filter(m=>m.w>0)){const p=res[res.length-1];if(p&&m.w<80&&p.w+m.w<=330){p.blocks.push(...m.blocks);p.w+=m.w}else res.push(m)}return res}
function toPages(blocks){const pages=[];let pg=null;
  for(const b of blocks){const bw=wc(b.t),h=/^## /.test(b.t);if(!pg||(pg.w>=40&&(pg.w+bw>135||h&&b.t.split('\n').length===1))){pg={bl:[],w:0};pages.push(pg)}pg.bl.push(b.t);pg.w+=bw}
  return pages.map((p,i)=>{let t='',txt=p.bl.join('\n\n');const m=txt.match(/^##\s+(.+)\n+/);if(m){t=m[1].replace(/^\d+[.)]\s*/,'');txt=txt.slice(m[0].length)}const m2=txt.match(/^##\s+(.+)\n+/);if(m2&&m2[1].trim().toLowerCase()===t.trim().toLowerCase())txt=txt.slice(m2[0].length);return{title:t,body:txt.trim()}}).filter(p=>p.body||p.title)}
function bookQuestions(ql,kl){
  const keyMap={};{let on=false;for(const l of kl){if(/^## /.test(l)){on=/multiple/i.test(l)}else if(on||/multiple choice/i.test(l)){if(/multiple choice/i.test(l)){on=true;continue}let m,re=/(\d{1,2})\s*[:.)-]?\s*([A-E])\b/g;while((m=re.exec(l)))keyMap[+m[1]]=m[2]}}}
  const parts=[];for(const l of ql){const m=l.match(/^## Part\s+\d+\s*(.*)$/i);if(m)parts.push({name:m[1],lines:[]});else if(parts.length)parts[parts.length-1].lines.push(l)}
  const out=[],sk={tf:0,syn:0,mcqNoKey:0};
  const items=lines=>{const it=[];for(const l of lines){if(!l.trim()||/^answer\s*_*\s*$/i.test(l.trim()))continue;const m=l.match(/^(\d{1,2})[.)]\s+(.*)$/);if(m)it.push({n:+m[1],t:m[2]});else if(it.length&&!/^(Choose|Answer each|Write |Work through|Read the|These questions)/i.test(l))it[it.length-1].t+=' '+l}return it};
  for(const p of parts){const nm=p.name.toLowerCase();
    if(/multiple/.test(nm)){let cur=null;const qs=[];for(const l of p.lines){let m;if((m=l.match(/^(\d{1,2})[.)]\s+(.*)$/))){cur={n:+m[1],q:m[2],o:[]};qs.push(cur)}else if(cur&&(m=l.match(/^([A-E])[.)]\s+(.*)$/)))cur.o.push(m[2]);else if(cur&&l.trim()&&!/^(Choose|Answer)/i.test(l)){cur.o.length?cur.o[cur.o.length-1]+=' '+l:cur.q+=' '+l}}
      for(const q of qs){const k='ABCDE'.indexOf(keyMap[q.n]||'');if(q.o.length<2||k<0||k>=q.o.length){sk.mcqNoKey++;continue}out.push({t:'mcq',q:q.q.trim(),o:q.o.map(x=>x.trim()),c:k,e:''})}}
    else if(/true/.test(nm))sk.tf+=items(p.lines).length;
    else if(/synthesis/.test(nm))sk.syn+=items(p.lines).length;
    else{const it=items(p.lines);
      if(/extended/.test(nm)&&it.length>1)out.push({t:'st',q:it[0].t,parts:it.slice(1).map((x,i)=>({q:x.t,m:2,a:'',ideas:[]}))});
      else it.forEach(x=>out.push({t:'st',q:x.t,parts:[{q:'Write your answer.',m:2,a:'',ideas:[]}]}))}}
  return{questions:out,skipped:sk}}
async function bookToLessons(file,subject,level0){
  const{doc,images,skipped}=await readBookDoc(file),lines=bookMarkup(doc).split('\n');
  const fm=file.name.match(/B(\d)_(\d+\.\d+)_(.+)\.docx$/i),level=fm?('b'+fm[1]):level0;
  const meta=(lines.find(l=>l.startsWith('@@META '))||'').slice(7).replace(/^sub ?strand\s*/i,'').replace(/\s+/g,' ').trim();
  const topic=fm?fm[2]+' '+fm[3].replace(/_/g,' '):(meta||file.name.replace(/\.[^.]+$/,''));
  const body=lines.filter(l=>!l.startsWith('@@META '));
  const at=k=>body.findIndex(l=>l===k),iS=at('@@SUMMARY'),iW=at('@@WORDS'),iQ=at('@@QUESTIONS'),iK=at('@@KEY');
  const ends=[iS,iW,iQ,iK].filter(x=>x>=0).sort((a,b)=>a-b);const end=ends.length?ends[0]:body.length;
  const seg=(i)=>{if(i<0)return[];const nx=[iS,iW,iQ,iK].filter(x=>x>i).sort((a,b)=>a-b)[0];return body.slice(i+1,nx===undefined?body.length:nx)};
  const lessons=[],E=EM;let order=0;const mk=(title,emoji,pages)=>{order++;lessons.push({subject,level,topic,kind:'learn',title:title.slice(0,100),emoji,order,status:'draft',pages,questions:[],source:file.name})};
  const ml=microLessons(bookBlocks(body.slice(0,end)),topic);
  ml.forEach((m,i)=>{const pages=toPages(m.blocks);if(!pages.length)return;let title=(m.blocks.find(b=>/^## /.test(b.t))||{}).t;title=title?title.split('\n')[0].replace(/^##\s*/,''):(m.sec||topic);
    if(i===0&&!/^## /.test(m.blocks[0].t)&&/🎯/.test(m.blocks[0].t))title='Get ready! What you will learn';mk(title,E[order%E.length],pages)});
  const rec=bookBlocks(seg(iS));if(rec.length){const pages=toPages(rec);pages.length&&mk('Quick recap','⭐',pages)}
  const wd=bookBlocks(seg(iW));if(wd.length){const pages=toPages(wd);pages.length&&mk('Word bank','📚',pages)}
  const q=bookQuestions(seg(iQ),seg(iK));
  if(q.questions.length)lessons.push({subject,level,topic,kind:'test',title:'Topic test',emoji:'🏆',order:900,status:'draft',pages:[],questions:q.questions,source:file.name});
  // keep only images that are actually used
  const used=new Set();lessons.forEach(l=>l.pages.forEach(p=>(p.body.match(/\[\[img:([a-z0-9]+)/gi)||[]).forEach(x=>used.add(x.slice(6)))));
  return{topic,level,lessons,images:images.filter(i=>used.has(i.id)),skippedPics:skipped,skippedQs:q.skipped}}
function bookPanelHtml(){return `<div class="panel"><h3>📖 Import a textbook chapter (Word)</h3><p class="hint">Best for your chapter books. Each file becomes a topic: short mini-lessons (a few cards each), the pictures, a recap, a word bank, and a topic test drafted from the end-of-chapter questions. True/false and creative "design a poster" tasks are left out. Everything is saved as <b>drafts</b>. You add the key ideas and key words to the structured questions, then publish.</p>
  <div class="two"><label class="f">Subject<select id="bs">${SUBJ.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select></label><label class="f">Class (used if the file name has no B7, B8 or B9)<select id="bl">${LVL.map(l=>`<option value="${l[0]}">${l[1]}</option>`).join('')}</select></label></div>
  <label class="f">Word files (.docx), one or many<input type="file" id="bf" accept=".docx" multiple></label><div class="actions"><button class="btn primary" id="bb">Import chapter(s)</button></div><div id="bm"></div></div>`}
function bookPanelWire(ap,again){
  $('#bb').onclick=async()=>{const fs=[...$('#bf').files],bm=$('#bm');if(!fs.length)return bm.innerHTML='<div class="msg err">Choose at least one .docx file.</div>';$('#bb').disabled=true;const rep=[];
    for(let i=0;i<fs.length;i++){const f=fs[i];bm.innerHTML=`<div class="msg okm">Reading ${esc(f.name)} (${i+1} of ${fs.length})…</div>`;
      try{const r=await bookToLessons(f,$('#bs').value,$('#bl').value);let up=0,bad=[];
        for(const im of r.images){const x=await api('imgSave',im);if(x.ok)up++;else bad.push(x.error)}
        let ok=0;for(const L of r.lessons){const x=await api('lessonSave',L);if(x.ok)ok++;else bad.push(L.title+': '+x.error)}
        rep.push(`<b>${esc(r.topic)}</b> (${lvlName(r.level)}): ${ok} lessons saved as drafts, ${up} pictures${r.skippedPics?`, ${r.skippedPics} pictures could not be used`:''}. Left out: ${r.skippedQs.tf} true/false, ${r.skippedQs.syn} creative tasks${r.skippedQs.mcqNoKey?`, ${r.skippedQs.mcqNoKey} multiple-choice with no answer key`:''}.${bad.length?'<br>Problems: '+bad.map(esc).join('<br>'):''}`)}
      catch(e){rep.push(`<b>${esc(f.name)}</b>: could not be read (${esc(e.message||'error')})`)}}
    bm.innerHTML=`<div class="msg okm">${rep.join('<br><br>')}</div><div class="actions"><button class="btn primary" id="bd">Show my lessons</button></div>`;$('#bd').onclick=again;$('#bb').disabled=false}}
boot();
