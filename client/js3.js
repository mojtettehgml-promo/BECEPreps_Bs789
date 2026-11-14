/* =============== administrator =============== */
let ADM_TAB='lessons';
const nm_=s=>esc(s.fullName||s.username)+(s.fullName?` <span class="meta">(${esc(s.username)})</span>`:'');
async function adminHome(tab){
  if(tab)ADM_TAB=tab;window.scrollTo(0,0);document.body.style.paddingBottom='0';
  const r=await api('me');if(r.ok)S.pending=r.pending||0;
  app.innerHTML=`<header class="hero"><div class="wrap"><div class="topbar"><span class="brandn">🦉 ${APP_NAME} · Teacher</span><button class="btn sm" id="so">Sign out</button></div></div></header><main class="wrap" style="padding-bottom:40px"><div class="admtabs" role="tablist">${[['lessons','📚 Lessons'],['learners','👧 Learners'+(S.pending?` (${S.pending} new)`:'')],['asg','📬 Homework'],['set','⚙️ Settings & backup']].map(([k,l])=>`<button data-at="${k}" class="${ADM_TAB===k?'on':''}">${l}</button>`).join('')}</div><div id="ap"></div></main>`;
  $('#so').onclick=signOut;app.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>adminHome(b.dataset.at));
  const ap=$('#ap');({lessons:adminLessons,learners:adminLearners,asg:adminAssign,set:adminSettings})[ADM_TAB](ap)}
/* ---------- learners ---------- */
async function adminLearners(ap){
  const r=await api('listUsers');if(!r.ok){ap.innerHTML=`<div class="msg err">${esc(r.error)}</div>`;return}
  const pend=r.users.filter(u=>u.status==='pending'),rest=r.users.filter(u=>u.status!=='pending');
  const card=u=>`<div class="ucard"><div><b>${nm_(u)}</b><span class="badge ${u.status==='active'?'':'d'}">${u.status}</span>${u.resetReq?'<span class="badge d">asked for a new password</span>':''}<div class="meta">📞 ${esc(u.phone)} · 🔑 ${r.vaultSet?(u.pw?`<span class="pw" data-pw="${esc(u.pw)}">show</span>`:'not stored'):'not stored (set PASSWORD_VAULT_KEY)'}</div><div class="meta">⭐ ${u.stars} · ${u.lessonsDone} lessons read · 🔥 ${u.streak} · last in ${u.lastLogin?fmtD(u.lastLogin):'never'}</div></div>
  <div class="actions" style="margin:0">${u.status==='pending'?`<button class="btn sm good" data-st="active" data-u="${esc(u.username)}">Approve</button><button class="btn sm danger" data-st="rejected" data-u="${esc(u.username)}">Reject</button>`:`<button class="btn sm" data-pwr="${esc(u.username)}">New password</button><button class="btn sm" data-rp="${esc(u.username)}">Reset progress</button><button class="btn sm" data-st="${u.status==='active'?'deactivated':'active'}" data-u="${esc(u.username)}">${u.status==='active'?'Deactivate':'Activate'}</button>`}<button class="btn sm danger" data-del="${esc(u.username)}">Delete</button></div></div>`;
  ap.innerHTML=`${pend.length?`<div class="panel"><h3>Waiting for approval (${pend.length})</h3>${pend.map(card).join('')}<div class="actions"><button class="btn primary" id="aa">Approve all</button></div></div>`:''}<div class="panel"><h3>Learners (${rest.length})</h3>${rest.map(card).join('')||'<p>No learners yet.</p>'}</div>`;
  const again=()=>adminLearners(ap);
  ap.querySelectorAll('.pw').forEach(s=>s.onclick=()=>{s.textContent=s.textContent==='show'?s.dataset.pw:'show'});
  ap.querySelectorAll('[data-st]').forEach(b=>b.onclick=async()=>{const x=await api('setStatus',{username:b.dataset.u,status:b.dataset.st});toast(x.ok?'Done':x.error);adminHome()});
  ap.querySelectorAll('[data-pwr]').forEach(b=>b.onclick=async()=>{const p=prompt('New password for '+b.dataset.pwr+' (at least 8 characters):');if(!p)return;const x=await api('adminResetPassword',{username:b.dataset.pwr,newPassword:p});toast(x.ok?'Password changed':x.error);if(x.ok)again()});
  ap.querySelectorAll('[data-rp]').forEach(b=>b.onclick=async()=>{if(!confirm('Reset all stars, lessons and streak for '+b.dataset.rp+'?'))return;const x=await api('adminResetProgress',{username:b.dataset.rp});toast(x.ok?'Progress reset':x.error)});
  ap.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete '+b.dataset.del+' and all their work? This cannot be undone.'))return;const x=await api('deleteUser',{username:b.dataset.del});toast(x.ok?'Deleted':x.error);adminHome()});
  const aa=$('#aa');if(aa)aa.onclick=async()=>{const x=await api('approveAll');toast(x.ok?x.approved+' approved':x.error);adminHome()}}
/* ---------- importers: Word / PDF -> reading text ---------- */
function htmlToMarkup(html){
  const d=new DOMParser().parseFromString(html,'text/html'),out=[];
  const inl=n=>{let s='';n.childNodes.forEach(c=>{if(c.nodeType===3)s+=c.nodeValue;else if(c.nodeType===1){const t=c.tagName.toLowerCase();if(t==='img')return;const i=inl(c);if(t==='strong'||t==='b')s+=i.trim()?'**'+i.trim()+'** ':'';else if(t==='sup')s+='^{'+i+'}';else if(t==='sub')s+='_{'+i+'}';else if(t==='br')s+='\n';else s+=i}});return s};
  const clean=s=>s.replace(/\*\*\s*\*\*/g,'').replace(/[ \t]+/g,' ').replace(/ ([,.;:!?])/g,'$1').trim();
  d.body.childNodes.forEach(n=>{if(n.nodeType!==1)return;const t=n.tagName.toLowerCase();
    if(/^h[1-6]$/.test(t)){const x=clean(inl(n).replace(/\*\*/g,''));if(x)out.push('## '+x);return}
    if(t==='ul'||t==='ol'){let k=0;n.querySelectorAll(':scope>li').forEach(li=>{const x=clean(inl(li));if(x)out.push((t==='ul'?'- ':(++k)+'. ')+x)});out.push('');return}
    if(t==='table'){n.querySelectorAll('tr').forEach(tr=>{const cells=[...tr.children].map(c=>clean(inl(c))).filter(Boolean);if(cells.length)out.push('- '+cells.join(' | '))});out.push('');return}
    if(t==='p'){const x=clean(inl(n));if(!x)return;const bare=x.replace(/\*\*/g,'');if(/^\*\*[^*]+\*\*$/.test(x)&&bare.split(/\s+/).length<=8&&!/[.?!]$/.test(bare))out.push('','## '+bare,'');else out.push(x,'')}});
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()}
async function readDocx(file){await loadScript(LIBS.mammoth,()=>window.mammoth);const r=await window.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{convertImage:window.mammoth.images.imgElement(()=>Promise.resolve({src:''}))});return htmlToMarkup(r.value)}
async function readPdf(file){
  await loadScript(LIBS.pdf,()=>window.pdfjsLib);window.pdfjsLib.GlobalWorkerOptions.workerSrc=LIBS.worker[0];
  const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,lines=[];
  for(let p=1;p<=pdf.numPages;p++){const tc=await (await pdf.getPage(p)).getTextContent(),rows=new Map();
    tc.items.forEach(it=>{if(!it.str||!it.str.trim()&&!it.hasEOL&&it.str!==' ')return;const y=Math.round(it.transform[5]/2);const r=rows.get(y)||{y:it.transform[5],h:0,xs:[]};r.h=Math.max(r.h,it.height||Math.abs(it.transform[3])||0);r.xs.push([it.transform[4],it.str,/bold/i.test(it.fontName||'')]);rows.set(y,r)});
    [...rows.values()].sort((a,b)=>b.y-a.y).forEach(r=>{r.xs.sort((a,b)=>a[0]-b[0]);const txt=r.xs.map(x=>x[1]).join('').replace(/\s+/g,' ').trim();if(txt)lines.push({t:txt,h:r.h,y:r.y,b:r.xs.every(x=>x[2]||!x[1].trim()),pg:p})});}
  const hs=lines.map(l=>l.h).filter(Boolean).sort((a,b)=>a-b),med=hs[Math.floor(hs.length/2)]||10,out=[];let prev=null;
  for(const l of lines){const head=(l.h>med*1.22||(l.b&&l.t.split(/\s+/).length<=8&&!/[.?!,]$/.test(l.t)))&&l.t.length<=90,bullet=/^([•\-*–]|\d{1,2}[.)])\s+/.test(l.t);
    const gap=prev&&prev.pg===l.pg?prev.y-l.y:0,newPara=!prev||prev.pg!==l.pg&&/[.?!:]$/.test(prev.t)||gap>l.h*1.9||head||bullet||(prev&&prev.head);
    if(head){out.push('','## '+l.t,'')}else if(bullet){out.push(l.t.replace(/^[•–*]\s+/,'- '))}else if(newPara||!out.length||!out[out.length-1]){out.push('',l.t)}else out[out.length-1]+=' '+l.t;l.head=head;prev=l}
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()}
const QMARK=/^(##\s*)?(\*\*)?\s*(questions?|exercises?|test yourself|quiz|practice( questions)?|check your understanding|review questions|assessment|self[- ]?test|let'?s test)\b.{0,30}$/i;
function splitLesson(text,fname){
  let lines=text.replace(/\r/g,'').split('\n'),qi=lines.findIndex(l=>QMARK.test(l.trim())&&l.trim().length<60);
  const read=(qi>=0?lines.slice(0,qi):lines).join('\n').trim(),qtext=qi>=0?lines.slice(qi+1).join('\n').trim():'';
  let body=read,title=fname.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).trim();
  const m=body.match(/^##\s+(.+)\n+/);if(m&&m[1].length<=70){title=m[1];body=body.slice(m[0].length)}
  const W=s=>(s.match(/\S+/g)||[]).length,tot=W(body),n=tot<150?1:tot<500?2:tot<=1800?3:Math.min(6,Math.round(tot/600));
  const units=[];body.split(/\n\s*\n/).forEach(b=>{b=b.trim();if(!b)return;if(/^##\s/.test(b)&&!b.includes('\n')&&units.length===0){units.push(b);return}units.push(b)});
  const merged=[];for(let i=0;i<units.length;i++){const u=units[i];if(/^##\s[^\n]*$/.test(u)&&i+1<units.length){units[i+1]=u+'\n'+units[i+1]}else merged.push(u)}
  const pages=[],target=tot/n;let acc=[],w=0;
  merged.forEach((u,i)=>{const uw=W(u),isH=/^##\s/.test(u);if(acc.length&&pages.length<n-1&&(w>=target||(isH&&w>=target*.6))){pages.push(acc);acc=[];w=0}acc.push(u);w+=uw});if(acc.length)pages.push(acc);
  const out=pages.map((p,i)=>{let b=p.join('\n\n'),t='';const h=b.match(/^##\s+(.+)\n+/);if(h){t=h[1];b=b.slice(h[0].length)}return{title:t||'Part '+(i+1),body:b.trim()}});
  return{title,pages:out.length?out:[{title:'Part 1',body:''}],qtext}}
function parseQs(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n'),qs=[],warn=[];let cur=null,ctx='q';
  const blank=s=>s.replace(/_{2,}|\.{4,}|…{2,}/g,'___');
  const ansIn=s=>{const m=s.match(/^(.*?)\bans(?:wer)?\s*[:=]\s*(.*)$/i);return m?[m[1].trim(),m[2].trim()]:[s.trim(),null]};
  const flush=()=>{if(!cur)return;const c=cur;cur=null;
    if(c.t==='mcq'){const ci='ABCDE'.indexOf((c.ans||'').trim().charAt(0).toUpperCase());if(c.o.length<2)warn.push('Question "'+c.q.slice(0,40)+'" has fewer than 2 options.');else if(ci<0||ci>=c.o.length)warn.push('Question "'+c.q.slice(0,40)+'" has no Answer line.');else qs.push({t:'mcq',q:c.q.trim(),o:c.o.map(x=>x.trim()),c:ci,e:(c.e||'').trim()})}
    else if(c.t==='fib'){const q=blank(c.q.trim());if((q.match(/___/g)||[]).length!==1||!c.ans)warn.push('Fill-in "'+c.q.slice(0,40)+'" needs one blank and an Answer.');else qs.push({t:'fib',q,a:c.ans.trim(),e:(c.e||'').trim()})}
    else{const parts=c.parts.map(p=>{const mm=p.q.match(/\[(\d{1,2})\]/),q=p.q.replace(/\[\d{1,2}\]/,'').trim();let m=mm?+mm[1]:0,a='',pts=[];const ans=(p.ans||'').trim();if(ans.includes(';')){pts=ans.split(';').map(x=>x.trim()).filter(Boolean);if(!m)m=pts.length}else{a=ans;if(!m)m=1}return{q,m,a,pts}});
      if(!parts.length||parts.some(p=>!p.q||(!p.a&&!p.pts.length)))warn.push('Structured "'+c.q.slice(0,40)+'" needs parts (a), (b)… each with an Answer.');else qs.push({t:'st',q:c.q.trim(),parts})}};
  for(const raw of lines){const l=raw.trim();if(!l)continue;let m;
    if((m=l.match(/^(?:fill|fib)\s*[:.\-]\s*(.*)$/i))){flush();const [q,a]=ansIn(m[1]);cur={t:'fib',q,ans:a};ctx='q';continue}
    if((m=l.match(/^(?:structured|st)\s*[:.\-]\s*(.*)$/i))){flush();cur={t:'st',q:m[1],parts:[]};ctx='q';continue}
    if(cur&&cur.t==='st'&&(m=l.match(/^\(([a-h])\)\s*(.*)$/i))){const [q,a]=ansIn(m[2]);cur.parts.push({q,ans:a});ctx='p';continue}
    if((m=l.match(/^(\d{1,3})[.)]\s+(.*)$/))&&!(cur&&cur.t==='st'&&false)){flush();cur={t:'mcq',q:m[2],o:[],ans:null};ctx='q';continue}
    if(cur&&cur.t==='mcq'&&(m=l.match(/^([A-E])[.)]\s+(.*)$/))){cur.o.push(m[2]);ctx='o';continue}
    if(cur&&(m=l.match(/^(?:ans(?:wer)?|correct(?: answer)?)\s*[:.\-=]\s*(.*)$/i))){if(cur.t==='st'){const p=cur.parts[cur.parts.length-1];if(p)p.ans=m[1]}else cur.ans=m[1];ctx='a';continue}
    if(cur&&(m=l.match(/^(?:explain|explanation|why|note)\s*[:.\-]\s*(.*)$/i))){cur.e=m[1];ctx='e';continue}
    if(!cur)continue;
    if(ctx==='q')cur.q+=' '+l;else if(ctx==='o')cur.o[cur.o.length-1]+=' '+l;else if(ctx==='e')cur.e+=' '+l;else if(ctx==='p'&&cur.parts.length){const p=cur.parts[cur.parts.length-1];p.ans!=null?p.ans+=' '+l:p.q+=' '+l}else if(ctx==='a'){if(cur.t==='st'){const p=cur.parts[cur.parts.length-1];if(p)p.ans+=' '+l}else cur.ans+=' '+l}}
  flush();return{qs,warn}}
function autoFib(pages){
  const out=[],seen=new Set();
  pages.forEach(p=>String(p.body||'').split('\n').forEach(line=>{if(/^##\s/.test(line))return;line=line.replace(/^([-•*]|\d+[.)])\s+/,'');
    (line.match(/[^.!?]+[.!?]?/g)||[]).forEach(s=>{s=s.trim();const ts=s.match(/\*\*(.+?)\*\*/g);if(!ts||ts.length!==1)return;const term=ts[0].slice(2,-2).trim();if(!term||term.length>40||term.split(/\s+/).length>3||s.length<25||s.length>220)return;
      const q=s.replace(ts[0],'___').replace(/\*\*|==/g,'');if(seen.has(q)||(q.match(/___/g)||[]).length!==1)return;seen.add(q);out.push({t:'fib',q,a:term,e:'',auto:true})})}));
  return out.slice(0,12)}
/* ---------- lessons list ---------- */
async function adminLessons(ap){
  const r=await api('lessonList');if(!r.ok){ap.innerHTML=`<div class="msg err">${esc(r.error)}</div>`;return}
  S.lessons=r.lessons;
  ap.innerHTML=`<div class="panel"><h3>Add lessons</h3><p class="hint">Upload a Word or PDF topic. It becomes a draft lesson split into reading pages (about 2 to 3). You then review it, add test questions and publish.</p>
  <div class="two"><label class="f">Subject<select id="us">${SUBJ.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select></label><label class="f">Word or PDF files<input type="file" id="uf" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple></label></div>
  <div class="actions"><button class="btn primary" id="ub">Create draft(s) from file(s)</button><button class="btn" id="nb">＋ Write a lesson by hand</button></div><div id="um"></div></div>
  ${SUBJ.map(s=>{const ls=r.lessons.filter(l=>l.subject===s.id);return `<div class="panel"><h3>${s.mas} ${s.title} (${ls.length})</h3>${ls.map(l=>`<div class="ucard"><div><b>${esc(l.emoji)} ${esc(l.title)}</b><span class="badge ${l.status==='published'?'':'d'}">${l.status}</span><div class="meta">${l.np} page${l.np>1?'s':''} · ${l.nq} question${l.nq===1?'':'s'} · order ${l.order}</div></div><div class="actions" style="margin:0"><button class="btn sm primary" data-e="${l.id}">Edit</button><button class="btn sm" data-p="${l.id}" data-s="${l.status==='published'?'draft':'published'}">${l.status==='published'?'Unpublish':'Publish'}</button><button class="btn sm danger" data-d="${l.id}">Delete</button></div></div>`).join('')||'<p class="hint">No lessons yet.</p>'}</div>`}).join('')}`;
  $('#nb').onclick=()=>lessonEditor({subject:$('#us').value,title:'',emoji:'📘',order:r.lessons.filter(l=>l.subject===$('#us').value).length+1,status:'draft',pages:[{title:'',body:''}],questions:[]});
  $('#ub').onclick=async()=>{const fs=[...$('#uf').files],um=$('#um');if(!fs.length)return um.innerHTML='<div class="msg err">Choose at least one file.</div>';const sid=$('#us').value;let made=[],bad=[];
    for(let i=0;i<fs.length;i++){const f=fs[i];um.innerHTML=`<div class="msg okm">Reading ${esc(f.name)} (${i+1} of ${fs.length})…</div>`;
      try{const txt=/\.pdf$/i.test(f.name)?await readPdf(f):await readDocx(f);if(txt.length<40)throw new Error('almost no text found (a scanned PDF has no text)');const sp=splitLesson(txt,f.name),pq=parseQs(sp.qtext),qs=pq.qs.concat(autoFib(sp.pages));
        const L={subject:sid,title:sp.title,emoji:subj(sid).mas,order:r.lessons.filter(l=>l.subject===sid).length+made.length+1,status:'draft',pages:sp.pages,questions:qs,source:f.name,_warn:pq.warn,_auto:qs.filter(q=>q.auto).length};made.push(L)}
      catch(e){bad.push(f.name+': '+(e.message||'could not be read'))}}
    if(fs.length===1&&made.length===1)return lessonEditor(made[0],true);
    let ok=0;for(const L of made){const x=await api('lessonSave',L);if(x.ok)ok++;else bad.push(L.title+': '+x.error)}
    toast(ok+' draft'+(ok===1?'':'s')+' created');if(bad.length){adminLessons(ap);setTimeout(()=>{const u=$('#um');if(u)u.innerHTML=`<div class="msg err">${bad.map(esc).join('<br>')}</div>`},100)}else adminLessons(ap)};
  ap.querySelectorAll('[data-e]').forEach(b=>b.onclick=async()=>{const x=await api('lessonGet',{id:b.dataset.e});if(x.ok)lessonEditor(x.lesson)});
  ap.querySelectorAll('[data-p]').forEach(b=>b.onclick=async()=>{const x=await api('lessonStatus',{id:b.dataset.p,status:b.dataset.s});toast(x.ok?'Done':x.error);adminLessons(ap)});
  ap.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this lesson? This cannot be undone.'))return;const x=await api('lessonDelete',{id:b.dataset.d});toast(x.ok?'Deleted':x.error);adminLessons(ap)})}
/* ---------- lesson editor ---------- */
function lessonEditor(L0,fresh){
  const ED=JSON.parse(JSON.stringify(L0));window.scrollTo(0,0);let showPrev=false;
  const draw=()=>{
    const qh=(q,i)=>{const head=`${q.t==='mcq'?'Multiple choice':q.t==='fib'?'Fill-in':'Structured'}${q.auto?' (auto-made, please check)':''}: ${String(q.q||'').slice(0,60)}`;
      let body='';
      if(q.t==='mcq')body=`<label class="f">Question<textarea data-q="${i}" data-f="q">${esc(q.q)}</textarea></label>${q.o.map((o,k)=>`<div class="row"><input type="radio" name="c${i}" ${q.c===k?'checked':''} data-c="${i}:${k}" aria-label="Correct answer"><span class="l">${'ABCDE'[k]}</span><input data-o="${i}:${k}" value="${esc(o)}">${q.o.length>2?`<button class="btn sm danger" data-ro="${i}:${k}">✕</button>`:''}</div>`).join('')}${q.o.length<5?`<button class="btn sm" data-ao="${i}" style="margin-top:6px">＋ option</button>`:''}<label class="f">Explanation (optional)<input data-q="${i}" data-f="e" value="${esc(q.e||'')}"></label>`;
      else if(q.t==='fib')body=`<label class="f">Sentence with one blank written as ___<textarea data-q="${i}" data-f="q">${esc(q.q)}</textarea></label><label class="f">Correct answer (separate accepted alternatives with |)<input data-q="${i}" data-f="a" value="${esc(q.a||'')}"></label><label class="f">Explanation (optional)<input data-q="${i}" data-f="e" value="${esc(q.e||'')}"></label>`;
      else body=`<label class="f">Question<textarea data-q="${i}" data-f="q">${esc(q.q)}</textarea></label>${q.parts.map((p,k)=>`<div class="qed" style="background:var(--card)"><b>Part ${'abcdefgh'[k]}</b> <button class="btn sm danger" data-rp="${i}:${k}" style="float:right">remove</button><label class="f">Part question<textarea data-pp="${i}:${k}:q">${esc(p.q)}</textarea></label><div class="two"><label class="f">Marks<input type="number" min="1" max="20" data-pp="${i}:${k}:m" value="${p.m}"></label><label class="f">Marking points, one per line (1 mark each, optional)<textarea data-pp="${i}:${k}:pts">${esc((p.pts||[]).join('\n'))}</textarea></label></div><label class="f">Model answer<textarea data-pp="${i}:${k}:a">${esc(p.a||'')}</textarea></label></div>`).join('')}<button class="btn sm" data-ap="${i}">＋ part</button>`;
      return `<details class="qed" ${fresh||q.auto?'':''}><summary><b>${i+1}.</b> ${esc(head)}</summary>${body}<div class="actions"><button class="btn sm danger" data-rq="${i}">Delete question</button><button class="btn sm" data-mv="${i}:-1">↑</button><button class="btn sm" data-mv="${i}:1">↓</button></div></details>`};
    app.innerHTML=`<header class="hero"><div class="wrap"><div class="topbar"><button class="btn sm" id="bk">← Lessons</button><span class="brandn">${ED.id?'Edit lesson':'New lesson'}</span></div></div></header><main class="wrap" style="padding-bottom:60px">
    ${L0._warn&&L0._warn.length?`<div class="msg err"><b>These questions in your file could not be read:</b><br>${L0._warn.map(esc).join('<br>')}</div>`:''}${L0._auto?`<div class="msg okm">${L0._auto} fill-in question${L0._auto>1?'s were':' was'} drafted from the <b>bold</b> key terms in your text. Check them, keep only the facts that never change, and delete the rest.</div>`:''}
    <div class="panel"><div class="two"><label class="f">Title<input id="lt" value="${esc(ED.title)}"></label><label class="f">Subject<select id="ls">${SUBJ.map(s=>`<option value="${s.id}" ${ED.subject===s.id?'selected':''}>${s.title}</option>`).join('')}</select></label></div><div class="two"><label class="f">Emoji<input id="le" maxlength="4" value="${esc(ED.emoji)}"></label><label class="f">Order in the subject<input id="lo" type="number" min="0" max="9999" value="${ED.order}"></label></div><p class="hint">Source: ${esc(ED.source||'typed by hand')}</p></div>
    <div class="panel"><h3>Reading pages (${ED.pages.length})</h3><p class="hint">Aim for 2 to 3 short, lively pages. Formatting: <code>**bold**</code> <code>==highlight==</code> <code>## heading</code> <code>- bullet</code> <code>1. step</code> <code>&gt; tip</code> <code>^{2}</code> <code>_{2}</code> <code>[[1/2]]</code></p>
    ${ED.pages.map((p,i)=>`<div class="qed"><b>Page ${i+1}</b> ${ED.pages.length>1?`<button class="btn sm danger" data-rg="${i}" style="float:right">remove page</button>`:''}<label class="f">Page title<input data-pg="${i}:title" value="${esc(p.title)}"></label><label class="f">Text<textarea data-pg="${i}:body" style="min-height:200px">${esc(p.body)}</textarea></label></div>`).join('')}
    <div class="actions"><button class="btn sm" id="ag">＋ Add a page</button><button class="btn sm" id="pv">${showPrev?'Hide':'Show'} preview</button></div>${showPrev?ED.pages.map((p,i)=>`<div class="prev"><div class="qn">PAGE ${i+1}</div>${p.title?`<h3 style="color:var(--brand)">${esc(p.title)}</h3>`:''}<div class="rich">${rich(p.body)}</div></div>`).join(''):''}</div>
    <div class="panel"><h3>Test questions (${ED.questions.length})</h3><p class="hint">Learners take multiple choice first, then fill-in, then structured questions.</p>${ED.questions.map(qh).join('')||'<p class="hint">None yet.</p>'}
    <div class="actions"><button class="btn sm" data-nq="mcq">＋ Multiple choice</button><button class="btn sm" data-nq="fib">＋ Fill-in</button><button class="btn sm" data-nq="st">＋ Structured</button><button class="btn sm" id="af">✨ Draft fill-ins from bold terms</button></div>
    <details><summary><b>Paste or upload questions as text</b></summary><p class="hint">Format:<br><code>1. Question text</code> · <code>A. option</code> … · <code>Answer: B</code> · <code>Explain: why</code><br><code>Fill: Plants make food by ___. Answer: photosynthesis|photo synthesis</code><br><code>Structured: Question</code> then <code>(a) Part text [2] Answer: point one; point two</code></p><textarea id="pq" style="min-height:160px" placeholder="Paste questions here"></textarea><div class="actions"><label class="btn sm" style="cursor:pointer">Upload Word/PDF of questions<input type="file" id="pqf" accept=".docx,.pdf" hidden></label><button class="btn sm primary" id="pqb">Add these questions</button></div><div id="pqm"></div></details></div>
    <div id="em"></div><div class="actions" style="position:sticky;bottom:8px"><button class="btn primary big" id="sv">Save draft</button><button class="btn good big" id="pb">Save &amp; publish</button></div></main>`;
    wire()};
  const wire=()=>{
    $('#bk').onclick=()=>{if(confirm('Leave without saving?'))adminHome('lessons')};
    $('#lt').oninput=e=>ED.title=e.target.value;$('#ls').onchange=e=>ED.subject=e.target.value;$('#le').oninput=e=>ED.emoji=e.target.value;$('#lo').oninput=e=>ED.order=e.target.value;
    app.querySelectorAll('[data-pg]').forEach(el=>el.oninput=()=>{const [i,f]=el.dataset.pg.split(':');ED.pages[+i][f]=el.value});
    app.querySelectorAll('[data-rg]').forEach(b=>b.onclick=()=>{ED.pages.splice(+b.dataset.rg,1);draw()});$('#ag').onclick=()=>{ED.pages.push({title:'',body:''});draw()};$('#pv').onclick=()=>{showPrev=!showPrev;draw()};
    app.querySelectorAll('[data-q]').forEach(el=>el.oninput=()=>{ED.questions[+el.dataset.q][el.dataset.f]=el.value});
    app.querySelectorAll('[data-o]').forEach(el=>el.oninput=()=>{const [i,k]=el.dataset.o.split(':');ED.questions[+i].o[+k]=el.value});
    app.querySelectorAll('[data-c]').forEach(el=>el.onchange=()=>{const [i,k]=el.dataset.c.split(':');ED.questions[+i].c=+k});
    app.querySelectorAll('[data-ao]').forEach(b=>b.onclick=()=>{ED.questions[+b.dataset.ao].o.push('');draw()});
    app.querySelectorAll('[data-ro]').forEach(b=>b.onclick=()=>{const [i,k]=b.dataset.ro.split(':').map(Number),q=ED.questions[i];q.o.splice(k,1);if(q.c>=q.o.length)q.c=0;draw()});
    app.querySelectorAll('[data-pp]').forEach(el=>el.oninput=()=>{const [i,k,f]=el.dataset.pp.split(':'),p=ED.questions[+i].parts[+k];if(f==='pts')p.pts=el.value.split('\n').map(x=>x.trim()).filter(Boolean);else if(f==='m')p.m=+el.value;else p[f]=el.value});
    app.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{ED.questions[+b.dataset.ap].parts.push({q:'',m:1,a:'',pts:[]});draw()});
    app.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{const [i,k]=b.dataset.rp.split(':').map(Number);ED.questions[i].parts.splice(k,1);draw()});
    app.querySelectorAll('[data-rq]').forEach(b=>b.onclick=()=>{ED.questions.splice(+b.dataset.rq,1);draw()});
    app.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const [i,d]=b.dataset.mv.split(':').map(Number),j=i+d;if(j<0||j>=ED.questions.length)return;[ED.questions[i],ED.questions[j]]=[ED.questions[j],ED.questions[i]];draw()});
    app.querySelectorAll('[data-nq]').forEach(b=>b.onclick=()=>{const t=b.dataset.nq;ED.questions.push(t==='mcq'?{t,q:'',o:['',''],c:0,e:''}:t==='fib'?{t,q:'',a:'',e:''}:{t,q:'',parts:[{q:'',m:1,a:'',pts:[]}]});draw();const ds=app.querySelectorAll('details.qed');if(ds.length){const d=ds[ds.length-1];d.open=true;d.scrollIntoView({block:'center'})}});
    $('#af').onclick=()=>{const a=autoFib(ED.pages.filter(p=>p.body)),have=new Set(ED.questions.map(q=>q.q)),add=a.filter(x=>!have.has(x.q));ED.questions.push(...add);toast(add.length?add.length+' fill-in questions drafted. Please check them.':'No suitable bold key terms found.');draw()};
    const addText=txt=>{const r=parseQs(txt),pm=$('#pqm');ED.questions.push(...r.qs);pm.innerHTML=`<div class="msg ${r.qs.length?'okm':'err'}">${r.qs.length} question${r.qs.length===1?'':'s'} added.${r.warn.length?'<br>Could not read: '+r.warn.map(esc).join('<br>'):''}</div>`;if(r.qs.length)setTimeout(draw,r.warn.length?2500:600)};
    $('#pqb').onclick=()=>addText($('#pq').value);
    $('#pqf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const t=/\.pdf$/i.test(f.name)?await readPdf(f):await readDocx(f);$('#pq').value=t.replace(/^##\s+/gm,'').replace(/\*\*/g,'');toast('Loaded. Check the text, then press Add.')}catch(x){$('#pqm').innerHTML=`<div class="msg err">${esc(x.message)}</div>`}};
    const save=async st=>{const em=$('#em');ED.status=st;const x=await api('lessonSave',{...ED,order:ED.order});if(!x.ok){em.innerHTML=`<div class="msg err">${esc(x.error)}</div>`;em.scrollIntoView({block:'center'});return}toast(st==='published'?'Published! Learners can see it.':'Draft saved');adminHome('lessons')};
    $('#sv').onclick=()=>save('draft');$('#pb').onclick=()=>save('published')};
  draw()}
/* ---------- homework (administrator) ---------- */
async function adminAssign(ap,view){
  if(view&&view.subs)return adminAsgSubs(ap,view.subs);
  const r=await api('asgAdminList');if(!r.ok){ap.innerHTML=`<div class="msg err">${esc(r.error)}</div>`;return}
  const edit=view&&view.edit?r.assignments.find(a=>a.id===view.edit):null;
  ap.innerHTML=`<div class="panel"><h3>${edit?'Edit homework':'New homework'}</h3><p class="hint">Learners see this under Homework. They photograph their work and upload it, and you mark it here.</p>
  <div class="two"><label class="f">Title<input id="at" value="${esc(edit?edit.title:'')}"></label><label class="f">Subject<select id="as">${SUBJ.map(m=>`<option value="${m.id}" ${edit&&edit.subject===m.id?'selected':''}>${m.title}</option>`).join('')}</select></label></div>
  <div class="two"><label class="f">Marked out of<input id="am" type="number" min="1" max="1000" value="${edit?edit.max:20}"></label><label class="f">Due date (optional)<input id="ad" type="date" value="${esc(edit?edit.due:'')}"></label></div>
  <label class="f">Instructions<textarea id="ai" style="min-height:120px" placeholder="What should they do? You can use **bold**, - bullets and 1. steps.">${esc(edit?edit.instructions:'')}</textarea></label>
  ${edit?`<label style="display:flex;gap:8px;margin:10px 0"><input type="checkbox" id="ac" style="width:auto" ${edit.closed?'checked':''}> Closed (learners can no longer hand in)</label>`:''}
  <div class="actions"><button class="btn primary" id="asv">${edit?'Save changes':'Publish homework'}</button>${edit?'<button class="btn" id="acn">Cancel</button>':''}</div><div id="amg"></div></div>
  <div class="panel"><h3>Homework (${r.assignments.length})</h3>${r.assignments.map(a=>`<div class="ucard"><div><b>${esc(a.title)}</b>${a.closed?'<span class="badge d">closed</span>':''}<div class="meta">${esc(subj(a.subject).title)} · out of ${a.max}${a.due?' · due '+dueTxt(a.due):''}</div><div class="meta">📥 ${a.submitted} to mark · ✅ ${a.marked} marked${a.returned?` · ↩ ${a.returned} returned`:''}</div></div><div class="actions" style="margin:0"><button class="btn sm primary" data-o="${a.id}">Open &amp; mark</button><button class="btn sm" data-e="${a.id}">Edit</button><button class="btn sm danger" data-d="${a.id}">Delete</button></div></div>`).join('')||'<p>None yet.</p>'}</div>`;
  $('#asv').onclick=async()=>{const v=id=>($('#'+id)||{}).value||'';const x=await api('asgSave',{id:edit?edit.id:'',title:v('at'),subject:v('as'),max:v('am'),due:v('ad'),instructions:v('ai'),closed:!!($('#ac')||{}).checked});if(!x.ok){$('#amg').innerHTML=`<div class="msg err">${esc(x.error)}</div>`;return}toast(edit?'Saved':'Homework published');adminAssign(ap)};
  const cn=$('#acn');if(cn)cn.onclick=()=>adminAssign(ap);
  ap.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>adminAsgSubs(ap,b.dataset.o));ap.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{adminAssign(ap,{edit:b.dataset.e});window.scrollTo(0,0)});
  ap.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this homework and every submission for it? This cannot be undone.'))return;const x=await api('asgDelete',{aid:b.dataset.d});toast(x.ok?'Deleted':x.error);adminAssign(ap)})}
async function adminAsgSubs(ap,aid){
  const r=await api('asgSubs',{aid});if(!r.ok){ap.innerHTML=`<div class="msg err">${esc(r.error)}</div>`;return}
  const a=r.assignment,SN={submitted:'Waiting to be marked',marked:'Marked',returned:'Returned'};
  ap.innerHTML=`<div class="panel"><button class="btn sm" id="bk">← All homework</button><h3 style="margin-top:10px">${esc(a.title)} <span class="meta">${esc(subj(a.subject).title)} · out of ${a.max}</span></h3>
  ${r.subs.map(s=>`<div class="ucard"><div><b>${nm_(s)}</b> <span class="badge ${s.status==='submitted'?'d':''}">${SN[s.status]}${s.status==='marked'?' '+s.score+'/'+a.max:''}</span>${s.late?' <span class="badge d">late</span>':''}<div class="meta">${s.pages} page${s.pages>1?'s':''} · handed in ${fmtD(s.at)}</div></div><button class="btn sm ${s.status==='submitted'?'primary':''}" data-m="${esc(s.username)}">${s.status==='submitted'?'Mark':'View / change'}</button></div>`).join('')||'<p>Nothing handed in yet.</p>'}
  ${r.missing.length?`<details style="margin-top:12px"><summary><b>Not handed in yet (${r.missing.length})</b></summary><p class="meta">${r.missing.map(m=>esc(m.fullName||m.username)).join(', ')}</p></details>`:''}</div>`;
  $('#bk').onclick=()=>adminAssign(ap);ap.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>adminMark(ap,aid,b.dataset.m))}
async function adminMark(ap,aid,u){
  const r=await api('asgSubGet',{aid,username:u});if(!r.ok){ap.innerHTML=`<div class="msg err">${esc(r.error)}</div>`;return}
  const a=r.assignment,s=r.sub,QUICK=['Well done!','Good effort. Check your working.','Show all your steps.','Check your spelling.','Please redo this question.','Neat work!'];
  ap.innerHTML=`<div class="panel"><button class="btn sm" id="bk">← Back to the list</button><h3 style="margin-top:10px">${nm_({fullName:s.fullName,username:s.username})} · ${esc(a.title)}</h3><p class="hint">Click a page to enlarge it.</p><div class="pgs">${r.pages.map((d,i)=>`<img src="${d}" alt="Page ${i+1} of ${r.pages.length}" class="pg" tabindex="0">`).join('')||'<p>No pages.</p>'}</div>
  <div class="two" style="margin-top:14px"><label class="f">Score (out of ${a.max}, halves allowed)<input id="sc" type="number" min="0" max="${a.max}" step="0.5" value="${s.status==='marked'?s.score:''}"></label><div class="f">Quick comments<div class="chips" style="margin-top:6px">${QUICK.map(q=>`<button type="button" class="cchip pick" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div></div>
  <label class="f">Feedback for the learner<textarea id="fb" style="min-height:120px">${esc(s.feedback||'')}</textarea></label>
  <div class="actions"><button class="btn primary" id="sv">Save mark</button><button class="btn good" id="svn">Save &amp; mark next</button><button class="btn" id="rt">↩ Return for resubmission</button><button class="btn danger" id="dl">Delete submission</button></div><div id="mm"></div></div>
  <div class="modal hide" id="zm" role="dialog" aria-label="Enlarged page" style="overflow:auto;place-items:start center"><img id="zi" alt="" style="max-width:none;width:min(1500px,200%);background:#fff"></div>`;
  const ctx=()=>({aid,username:u,score:$('#sc').value,feedback:$('#fb').value}),say=(m,ok)=>{$('#mm').innerHTML=`<div class="msg ${ok?'okm':'err'}">${esc(m)}</div>`};
  $('#bk').onclick=()=>adminAsgSubs(ap,aid);
  ap.querySelectorAll('.pg').forEach(i=>{const z=()=>{$('#zi').src=i.src;$('#zm').classList.remove('hide')};i.onclick=z;i.onkeydown=e=>{if(e.key==='Enter')z()}});$('#zm').onclick=()=>$('#zm').classList.add('hide');
  ap.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const t=$('#fb');t.value=(t.value?t.value.replace(/\s+$/,'')+'\n':'')+b.dataset.q});
  const save=async next=>{if($('#sc').value==='')return say('Enter a score first.');const x=await api('asgMark',ctx());if(!x.ok)return say(x.error);toast('Mark saved');if(next){const l=await api('asgSubs',{aid}),n=l.ok&&l.subs.find(z=>z.status==='submitted');if(n)return adminMark(ap,aid,n.username);toast('That was the last one waiting.')}adminAsgSubs(ap,aid)};
  $('#sv').onclick=()=>save(false);$('#svn').onclick=()=>save(true);
  $('#rt').onclick=async()=>{if(!confirm('Send this back so the learner can hand it in again?'))return;const x=await api('asgReturn',ctx());if(!x.ok)return say(x.error);toast('Returned');adminAsgSubs(ap,aid)};
  $('#dl').onclick=async()=>{if(!confirm("Delete this learner's submission and mark?"))return;const x=await api('asgSubDelete',{aid,username:u});if(!x.ok)return say(x.error);toast('Deleted');adminAsgSubs(ap,aid)}}
/* ---------- settings & backup ---------- */
async function adminSettings(ap){
  const r=await api('me');S.twoStep=r.twoStep;S.vaultSet=r.vaultSet;S.settings=r.settings;
  ap.innerHTML=`<div class="panel"><h3>Subject challenge</h3><div class="two"><label class="f">Questions in a challenge<input id="mq" type="number" min="5" max="100" value="${S.settings.mockq}"></label><label class="f">Minutes allowed<input id="mt" type="number" min="5" max="180" value="${S.settings.mockt}"></label></div><div class="actions"><button class="btn primary" id="ss">Save</button></div></div>
  <div class="panel"><h3>Backup</h3><p class="hint">Download a copy of all lessons, learners' progress and homework. Do this before every update.</p><div class="actions"><button class="btn primary" id="bk">⬇ Download backup</button><label class="btn" style="cursor:pointer">⬆ Restore lessons from a backup<input type="file" id="rf" accept=".json" hidden></label></div><div id="bm"></div></div>
  <div class="panel"><h3>Two-step sign-in (you)</h3>${S.twoStep?'<p>✅ On. You need a 6-digit code from your authenticator app to sign in.</p><div class="actions"><label class="f" style="margin:0">Code to turn off<input id="tc" inputmode="numeric" style="max-width:160px"></label><button class="btn danger" id="toff">Turn off</button></div>':'<p class="hint">Adds a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator…).</p><div class="actions"><button class="btn" id="ton">Set up</button></div><div id="tsetup"></div>'}</div>
  <div class="panel"><h3>Learners' passwords</h3><p>${S.vaultSet?'✅ You can see learners\' passwords in the Learners tab.':'⚠️ PASSWORD_VAULT_KEY is not set, so passwords are not stored readably. Add it in Cloudflare (Settings → Variables and Secrets) to see them.'}</p></div>
  <div class="panel"><h3>Danger zone</h3><div class="actions"><button class="btn danger" id="rall">Reset everyone's progress</button></div></div><p class="hint">${APP_NAME} ${APP_VERSION}</p>`;
  $('#ss').onclick=async()=>{const x=await api('setSettings',{mockq:$('#mq').value,mockt:$('#mt').value});toast(x.ok?'Saved':x.error);if(x.ok)S.settings=x.settings};
  $('#bk').onclick=async()=>{const x=await api('exportAll');if(!x.ok)return $('#bm').innerHTML=`<div class="msg err">${esc(x.error)}</div>`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(x)],{type:'application/json'}));a.download='bece-prep-zone-backup-'+dayKey()+'.json';a.click();$('#bm').innerHTML='<div class="msg okm">Backup downloaded.</div>'};
  $('#rf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j.lessons))throw new Error('This file has no lessons.');if(!confirm('Restore '+j.lessons.length+' lessons? Lessons with the same id are replaced.'))return;const x=await api('importLessons',{lessons:j.lessons});$('#bm').innerHTML=`<div class="msg ${x.ok?'okm':'err'}">${x.ok?x.imported+' lessons restored.':esc(x.error)}</div>`}catch(x){$('#bm').innerHTML=`<div class="msg err">${esc(x.message)}</div>`}};
  const ton=$('#ton');if(ton)ton.onclick=async()=>{const x=await api('totpSetup');if(!x.ok)return toast(x.error);$('#tsetup').innerHTML=`<div class="msg okm">In your authenticator app choose "enter a setup key" and type:<br><b style="font-size:20px;letter-spacing:2px">${esc(x.secret)}</b><br>Then enter the 6-digit code it shows:</div><div class="actions"><input id="tc2" inputmode="numeric" style="max-width:160px"><button class="btn primary" id="ten">Turn on</button></div>`;$('#ten').onclick=async()=>{const y=await api('totpEnable',{code:$('#tc2').value});toast(y.ok?'Two-step sign-in is on':y.error);if(y.ok)adminSettings(ap)}};
  const toff=$('#toff');if(toff)toff.onclick=async()=>{const y=await api('totpDisable',{code:$('#tc').value});toast(y.ok?'Turned off':y.error);if(y.ok)adminSettings(ap)};
  $('#rall').onclick=async()=>{if(!confirm("Reset EVERY learner's stars, lessons and streak? This cannot be undone."))return;const x=await api('adminResetAllProgress');toast(x.ok?x.reset+' learners reset':x.error)}}
boot();
