/* ---- answers ---- */
const normA=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ɛ/g,'e').replace(/ɔ/g,'o').replace(/ŋ/g,'n').replace(/[^a-z0-9. \/-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\.$/,'');
const fibOk=(q,v)=>{const n=normA(v);if(!n)return false;return String(q.a).split('|').some(a=>{const m=normA(a);return m&&(m===n||m.replace(/ /g,'')===n.replace(/ /g,''))})};
const fibShow=q=>String(q.a).split('|')[0].trim();
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const fmtT=s=>Math.floor(s/60)+':'+pad2(s%60);
const stem=w=>{w=w.replace(/ies$/,'y');return w.length>4?w.replace(/(ing|ed|es|s|ly)$/,''):w};
function near(a,b){if(a===b)return true;if(Math.abs(a.length-b.length)>1||a.length<6)return false;let i=0,j=0,e=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++e>1)return false;if(a.length>b.length)i++;else if(a.length<b.length)j++;else{i++;j++}}return e+(a.length-i)+(b.length-j)<=1}
function hasKey(txt,key){const t=normA(txt),k=normA(key);if(!k)return false;if(k.includes(' ')||/\d/.test(k))return(' '+t+' ').includes(' '+k+' ')||t.replace(/ /g,'').includes(k.replace(/ /g,''));const ks=stem(k);return t.split(' ').some(w=>w===k||stem(w)===ks||near(stem(w),ks))}
const ideaHit=(txt,idea)=>(idea.k||[]).some(k=>hasKey(txt,k));
const stP=x=>x.parts||[];const stTot=x=>stP(x).reduce((a,p)=>a+p.m,0);
/* ---- the question runner: one question per screen ---- */
function runQuiz(o){
  const items=o.items;let idx=0,left=o.timer||0,tid=null;const res=[];
  const done=()=>{clearInterval(tid);o.onDone(res)};
  const bar=()=>`<div class="qbar"><div class="wrap"><button class="btn sm" id="ex" aria-label="Leave">✕</button><div class="pb"><i style="width:${Math.round(100*idx/items.length)}%"></i></div><b>${idx+1}/${items.length}</b>${o.timer?`<span class="cchip" id="tm">⏱ ${fmtT(left)}</span>`:''}</div></div>`;
  const wireExit=()=>{$('#ex').onclick=()=>{if(confirm('Leave this? Your answers so far will not be saved.')){clearInterval(tid);o.onExit()}}};
  if(o.timer)tid=setInterval(()=>{left--;const t=$('#tm');if(t)t.textContent='⏱ '+fmtT(Math.max(0,left));if(left<=0){toast('Time is up!');done()}},1000);
  const next=r=>{res.push(r);idx++;idx>=items.length?done():show()};
  function show(){
    window.scrollTo(0,0);const it=items[idx],q=it.q,lastQ=idx===items.length-1,nxl=lastQ?'See my results ▶':'Next ▶';
    if(it.k==='mcq'){
      app.innerHTML=bar()+`<main class="wrap"><section class="qcard"><span class="qn">QUESTION ${idx+1}</span><div class="qtext">${rtInline(q.q)}</div><div id="ops">${q.o.map((t,k)=>`<button class="opt" data-k="${k}"><span class="l">${'ABCDE'[k]}</span><span>${rtInline(t)}</span></button>`).join('')}</div><div id="fb" aria-live="polite"></div><div class="actions"><button class="btn primary" id="nx" disabled>${nxl}</button></div></section></main>`;wireExit();
      let pick=-1,locked=false;const ops=[...app.querySelectorAll('.opt')];
      ops.forEach(b=>b.onclick=()=>{if(locked)return;pick=+b.dataset.k;
        if(o.instant){locked=true;const ok=pick===q.c;ops.forEach((z,k)=>{z.disabled=true;if(k===q.c)z.classList.add('right');else if(k===pick)z.classList.add('wrong')});
          $('#fb').innerHTML=`<div class="fbk ${ok?'ok':'no'}">${ok?'🎉 Correct! Well done!':'Not quite. The answer is '+'ABCDE'[q.c]+'.'}${q.e?`<div class="rich">${rich(q.e)}</div>`:''}</div>`;beep(ok?'ok':'no');if(ok)touchStreak();$('#nx').disabled=false;$('#nx').onclick=()=>next({it,ok});$('#nx').focus()}
        else{ops.forEach(z=>z.classList.toggle('sel',z===b));$('#nx').disabled=false;$('#nx').onclick=()=>next({it,ok:pick===q.c,pick})}})}
    else if(it.k==='fib'){
      const parts=q.q.split('___');
      app.innerHTML=bar()+`<main class="wrap"><section class="qcard fib"><span class="qn">FILL IN THE BLANK ${idx+1}</span><div class="qtext">${rtInline(parts[0])}<b style="color:var(--brand2)">_____</b>${rtInline(parts.slice(1).join('___'))}</div><label class="hide" for="a">Your answer</label><input id="a" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type your answer"><div id="fb" aria-live="polite"></div><div class="actions"><button class="btn primary" id="ck">${o.instant?'Check ✓':nxl}</button><button class="btn primary hide" id="nx">${nxl}</button></div></section></main>`;wireExit();
      const a=$('#a');a.focus();let checked=false;
      const go=()=>{if(!o.instant)return next({it,ok:fibOk(q,a.value),ans:a.value});
        if(checked)return;if(!a.value.trim()){toast('Type your answer first.');return}checked=true;const ok=fibOk(q,a.value);a.disabled=true;
        $('#fb').innerHTML=`<div class="fbk ${ok?'ok':'no'}">${ok?'🎉 Correct! Well done!':'Not quite. The answer is <b>'+esc(fibShow(q))+'</b>.'}${q.e?`<div class="rich">${rich(q.e)}</div>`:''}</div>`;beep(ok?'ok':'no');if(ok)touchStreak();
        $('#ck').classList.add('hide');const nx=$('#nx');nx.classList.remove('hide');nx.onclick=()=>next({it,ok});nx.focus()};
      $('#ck').onclick=go;a.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();checked&&$('#nx')?$('#nx').click():go()}}}
    else{ /* structured, self-marked */
      const P_=stP(q),tot=stTot(q),sc=P_.map(()=>0),shown=P_.map(()=>false);
      app.innerHTML=bar()+`<main class="wrap"><section class="qcard"><span class="qn">STRUCTURED QUESTION ${idx+1} · ${tot} marks</span><div class="qtext">${rtInline(q.q)}</div></section>
      ${P_.map((p,k)=>`<section class="qcard" data-k="${k}"><span class="qn">PART ${'abcdefghij'[k]||k+1}</span> <span class="tag">${p.m} mark${p.m>1?'s':''}</span><div class="qtext">${rtInline(p.q)}</div><label class="hide" for="st${k}">Your answer</label><textarea id="st${k}" placeholder="${p.ideas&&p.ideas.length?'Type your answer here in your own words.':'Write your answer here, or on paper, then show the model answer.'}"></textarea><div class="actions"><button class="btn primary" data-show="${k}">${p.ideas&&p.ideas.length?'Check my answer ✓':'Show the model answer'}</button></div><div class="slot" aria-live="polite"></div></section>`).join('')}
      <div class="actions"><button class="btn primary big" id="fin">${nxl}</button></div></main>`;wireExit();
      app.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const k=+b.dataset.show,p=P_[k],card=b.closest('.qcard'),ta=card.querySelector('textarea'),slot=card.querySelector('.slot');
        const ans=p.a?`<div class="rich">${rich(p.a)}</div>`:'';
        if(p.ideas&&p.ideas.length){
          if(ta.value.trim().length<3){toast('Type your answer first. Try your best!');return}
          shown[k]=true;ta.disabled=true;b.classList.add('hide');const hit=p.ideas.map(x=>ideaHit(ta.value,x)),claim=p.ideas.map(()=>false);
          const calc=()=>{sc[k]=Math.min(p.m,hit.filter(Boolean).length+claim.filter(Boolean).length);slot.querySelector('.got').textContent=sc[k]+' / '+p.m};
          slot.innerHTML=`<div class="mark"><b>Marks: <span class="got"></span></b><div class="meta">Marks are given for the ideas and key words in your answer, not for exact wording.</div>${p.ideas.map((x,j)=>`<div class="idea ${hit[j]?'ok':'no'}" data-j="${j}"><span class="ic">${hit[j]?'✅':'⬜'}</span><span>${rtInline(x.t)}${hit[j]?'':' <button class="link" data-claim="'+j+'">I said this in my own words</button>'}</span></div>`).join('')}</div>${ans?`<div class="model"><b>Model answer</b>${ans}</div>`:''}`;
          slot.querySelectorAll('[data-claim]').forEach(c=>c.onclick=()=>{const j=+c.dataset.claim;claim[j]=!claim[j];const row=slot.querySelector('.idea[data-j="'+j+'"]');row.classList.toggle('ok',claim[j]);row.classList.toggle('no',!claim[j]);row.querySelector('.ic').textContent=claim[j]?'✅':'⬜';c.textContent=claim[j]?'Undo':'I said this in my own words';calc()});calc();if(sc[k]>=p.m)beep('ok');return}
        if(!ta.value.trim()&&!confirm('You have not written anything yet. Show the answer anyway?'))return;shown[k]=true;ta.disabled=true;b.classList.add('hide');
        if(p.pts&&p.pts.length){slot.innerHTML=`<div class="model"><b>Model answer</b>${ans}</div><div class="mark"><b>Tick every point you wrote:</b>${p.pts.map(t=>`<label class="pt"><input type="checkbox" data-pt="${k}"> <span>${rtInline(t)}</span></label>`).join('')}<div class="meta">Each point is 1 mark. Be honest!</div></div>`;
          slot.querySelectorAll('[data-pt]').forEach(c=>c.onchange=()=>{sc[k]=Math.min(p.m,slot.querySelectorAll('[data-pt]:checked').length)})}
        else{slot.innerHTML=`<div class="model"><b>Model answer</b>${ans}</div><div class="mark"><b>How many marks did you earn? (out of ${p.m})</b><div class="chips" role="radiogroup">${Array.from({length:p.m+1},(_,v)=>`<button class="cchip pick" role="radio" aria-checked="false" data-v="${v}">${v}</button>`).join('')}</div></div>`;
          slot.querySelectorAll('[data-v]').forEach(c=>c.onclick=()=>{sc[k]=+c.dataset.v;slot.querySelectorAll('[data-v]').forEach(z=>{z.classList.toggle('ok',z===c);z.setAttribute('aria-checked',z===c)})})}});
      $('#fin').onclick=()=>{if(!shown.every(Boolean)){toast('Finish every part first.');return}next({it,s:sc.reduce((a,b)=>a+b,0),t:tot})}}
  }
  show()}
/* ---- mistakes notebook ---- */
const mkId=(lid,q)=>lid+'|'+normA(q.q).slice(0,120);
function addMistakes(list){const m=P().mistakes=P().mistakes||[];for(const r of list){if(r.it.k==='st'||r.ok)continue;const q=r.it.q,id=mkId(r.it.lid||'x',q);if(!m.some(x=>x.id===id))m.push({id,k:r.it.k,q})}while(m.length>100)m.shift()}
function clearMistakes(list){const m=P().mistakes=P().mistakes||[];for(const r of list){if(r.ok){const id=mkId(r.it.lid||'x',r.it.q),i=m.findIndex(x=>x.id===id);if(i>=0)m.splice(i,1)}}}
const starRow=pct=>pct>=80?'⭐⭐⭐':pct>=50?'⭐⭐☆':pct>=20?'⭐☆☆':'☆☆☆';
/* ---- lesson test: multiple choice, then fill-in, then structured ---- */
const shufMcq=q=>{if(q.o.some(t=>/\b(all|none) of the above\b|\bboth\b/i.test(t)))return q;const idx=shuffle(q.o.map((_,i)=>i));return{...q,o:idx.map(i=>q.o[i]),c:idx.indexOf(q.c)}};
async function lessonTest(L){
  const isT=L.kind==='test';let pool=L.questions.map(q=>({...q,lid:L.id}));
  if(isT){const r=await api('subjectQs',{subject:L.subject,level:lvlOf(L),bank:true});if(r.ok){const seen=new Set(pool.map(q=>normA(q.q)));r.questions.filter(q=>(q.topic||'')===(L.topic||'')).forEach(q=>{const k=normA(q.q);if(!seen.has(k)){seen.add(k);pool.push(q)}})}}
  const nMc=isT?8:5,nSt=isT?3:1,mc=shuffle(pool.filter(q=>q.t==='mcq')).slice(0,nMc).map(q=>({k:'mcq',q:shufMcq(q),lid:q.lid})),st=shuffle(pool.filter(q=>q.t==='st')).slice(0,nSt).map(q=>({k:'st',q,lid:q.lid})),fb=shuffle(pool.filter(q=>q.t==='fib')).slice(0,2).map(q=>({k:'fib',q,lid:q.lid}));
  const items=[...mc,...fb,...st];
  if(!items.length){toast('This lesson has no questions yet.');return subject(L.subject)}
  const before=starsTotal();
  runQuiz({items,instant:true,onExit:()=>L.pages.length?openLesson(L.id,L.pages.length-1):subject(L.subject),onDone:res=>{
    const cnt=k=>({c:res.filter(r=>r.it.k===k&&r.ok).length,t:res.filter(r=>r.it.k===k).length}),m=cnt('mcq'),f=cnt('fib'),st=res.filter(r=>r.it.k==='st'),ss=st.reduce((a,r)=>a+r.s,0),stt=st.reduce((a,r)=>a+r.t,0);
    const rc=rec(L.id),b=rc.b=rc.b||{};b.mcq=Math.max(b.mcq||0,m.c);b.fib=Math.max(b.fib||0,f.c);b.st=Math.max(b.st||0,ss);rc.read=true;rc.last=Date.now();
    addMistakes(res);clearMistakes(res);touchStreak();queueSave();
    const got=m.c+f.c+ss,all=m.t+f.t+stt,pct=all?Math.round(100*got/all):0,gain=starsTotal()-before,idx=S.lessons.filter(l=>l.subject===L.subject&&lvlOf(l)===lvlOf(L)&&(l.topic||'')===(L.topic||'')),at=idx.findIndex(l=>l.id===L.id),nx=idx.slice(at+1).find(l=>l.kind!=='test');
    window.scrollTo(0,0);if(pct>=60){confetti();beep('win')}
    app.innerHTML=`<header class="hero"><div class="wrap"><h1>${esc(L.emoji)} ${esc(L.title)}</h1><p class="lede">Test finished</p></div></header><main class="wrap"><div class="res"><div class="stars" aria-hidden="true">${starRow(pct)}</div><div class="big">${pct}%</div><p><b>${pct>=80?'Brilliant work!':pct>=50?'Good effort!':'Keep going, you can do it!'}</b>${gain>0?` You earned <b>${gain} new star${gain>1?'s':''}</b> ⭐`:''}</p>
    <div class="chips" style="justify-content:center">${m.t?`<span class="cchip">Multiple choice ${m.c}/${m.t}</span>`:''}${f.t?`<span class="cchip">Fill-in ${f.c}/${f.t}</span>`:''}${stt?`<span class="cchip">Structured ${ss}/${stt}</span>`:''}</div>
    <div class="actions" style="justify-content:center"><button class="btn primary" id="again">Try again 🔁</button>${L.pages.length?'<button class="btn" id="rd">Read again 📖</button>':''}${nx?'<button class="btn good" id="nxl">Next mini-lesson ▶</button>':''}<button class="btn" id="bk">Back to the path</button></div></div></main>${nav('home')}`;wireNav();
    $('#again').onclick=()=>lessonTest(L);const rdb=$('#rd');if(rdb)rdb.onclick=()=>openLesson(L.id);$('#bk').onclick=()=>subject(L.subject);const n=$('#nxl');if(n)n.onclick=()=>openLesson(nx.id)}})}
/* ---- timed subject challenge ---- */
async function mock(sid){
  const r=await api('subjectQs',{subject:sid,level:S.level});if(!r.ok)return toast(r.error);
  if(r.questions.length<5)return toast('Not enough questions yet. Finish a few lessons first!');
  const items=shuffle(r.questions).slice(0,S.settings.mockq).map(q=>({k:q.t,q:q.t==='mcq'?shufMcq(q):q,lid:q.lid})),s=subj(sid);
  if(!confirm(`Subject challenge: ${items.length} questions in ${S.settings.mockt} minutes. Ready?`))return;
  runQuiz({items,instant:false,timer:S.settings.mockt*60,onExit:()=>subject(sid),onDone:res=>{
    const c=res.filter(x=>x.ok).length,n=items.length,pct=Math.round(100*c/n),m=(P().mock=P().mock||{}),old=m[sid]||{},before=starsTotal();
    m[sid]={best:Math.max(old.best||0,c),n,at:Date.now()};addMistakes(res);touchStreak();queueSave();const gain=starsTotal()-before;
    window.scrollTo(0,0);if(pct>=60){confetti();beep('win')}
    const wrong=res.filter(x=>!x.ok);
    app.innerHTML=`<header class="hero" style="--brand:${s.c1};--brand2:${s.c2}"><div class="wrap"><h1>${s.mas} Challenge done!</h1></div></header><main class="wrap"><div class="res"><div class="stars">${starRow(pct)}</div><div class="big">${c}/${n}</div><p><b>${pct>=80?'Super Star!':pct>=50?'Good job!':'Practise a little more and try again.'}</b>${gain>0?` +${gain} ⭐`:''}</p><p class="hint">${res.length<n?`You answered ${res.length} of ${n}. `:''}Questions you missed were saved in <b>Fix my mistakes</b>.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="a">Try another 🔁</button><button class="btn" id="b">Back</button></div></div>
    ${wrong.length?`<div class="panel"><h3>Let's look at what you missed</h3>${wrong.map(x=>`<div class="ucard" style="display:block"><div class="rich">${rtInline(x.it.q.q)}</div><div class="hint">Answer: <b>${x.it.k==='mcq'?rtInline(x.it.q.o[x.it.q.c]):esc(fibShow(x.it.q))}</b></div></div>`).join('')}</div>`:''}</main>${nav('home')}`;wireNav();$('#a').onclick=()=>mock(sid);$('#b').onclick=()=>subject(sid)}})}

/* ---- exam practice: past and practice papers uploaded by the teacher ---- */
async function examInfo(sid){const el=$('#exw');if(!el)return;const r=await api('examList');if(!r.ok||!$('#exw'))return;
  const ps=r.papers.filter(p=>p.subject===sid&&p.level===S.level);if(!ps.length)return;
  const by=new Map();ps.forEach(p=>by.set(p.paper,(by.get(p.paper)||0)+p.n));const tot=[...by.values()].reduce((a,b)=>a+b,0);
  el.innerHTML=`<div class="panel"><h3>📝 Exam practice (${lvlName(S.level)})</h3><p class="hint">Questions from exam papers, mixed at random each time. ${tot} questions in ${by.size} paper${by.size>1?'s':''}.</p><div class="actions"><button class="btn primary" id="exall">Mixed practice</button></div>${by.size>1?`<div class="chips" style="margin-top:8px">${[...by.entries()].map(([t,n])=>`<button class="btn sm" data-ex="${esc(t)}">${esc(t)} (${n})</button>`).join('')}</div>`:''}</div>`;
  $('#exall').onclick=()=>examPractice(sid,'');el.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>examPractice(sid,b.dataset.ex))}
async function examPractice(sid,paper){
  const r=await api('examQs',{subject:sid,level:S.level,paper});if(!r.ok)return toast(r.error);
  if(!r.questions.length)return toast('No exam questions here yet.');
  const items=shuffle(r.questions).slice(0,Math.max(5,S.settings.mockq)).map(q=>({k:q.t,q:q.t==='mcq'?shufMcq(q):q,lid:q.lid})),s=subj(sid);
  if(!confirm(`Exam practice: ${items.length} questions in ${S.settings.mockt} minutes. Ready?`))return;
  runQuiz({items,instant:false,timer:S.settings.mockt*60,onExit:()=>subject(sid),onDone:res=>{
    const c=res.filter(x=>x.ok).length,n=items.length,pct=Math.round(100*c/n),before=starsTotal();addMistakes(res);touchStreak();queueSave();const gain=starsTotal()-before;
    window.scrollTo(0,0);if(pct>=60){confetti();beep('win')}
    const wrong=res.filter(x=>!x.ok);
    app.innerHTML=`<header class="hero" style="--brand:${s.c1};--brand2:${s.c2}"><div class="wrap"><h1>${s.mas} Exam practice done!</h1></div></header><main class="wrap"><div class="res"><div class="stars">${starRow(pct)}</div><div class="big">${c}/${n}</div><p><b>${pct>=80?'Super Star!':pct>=50?'Good job!':'Practise a little more and try again.'}</b>${gain>0?` +${gain} ⭐`:''}</p><p class="hint">Questions you missed were saved in <b>Fix my mistakes</b>.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="a">Try another 🔁</button><button class="btn" id="b">Back</button></div></div>
    ${wrong.length?`<div class="panel"><h3>Let's look at what you missed</h3>${wrong.map(x=>`<div class="ucard" style="display:block"><div class="rich">${rtInline(x.it.q.q)}</div><div class="hint">Answer: <b>${x.it.k==='mcq'?rtInline(x.it.q.o[x.it.q.c]):esc(fibShow(x.it.q))}</b></div></div>`).join('')}</div>`:''}</main>${nav('home')}`;wireNav();$('#a').onclick=()=>examPractice(sid,paper);$('#b').onclick=()=>subject(sid)}})}

/* ---- question bank: random practice from the notes' questions and answers ---- */
const qh=str=>{let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return (h>>>0).toString(36)};
const qid=(lid,q)=>qh(lid+'|'+normA(q.q).slice(0,160));
const bankSeen=()=>((P().bank=P().bank||{}).seen=P().bank.seen||{});
async function bankInfo(sid){
  const r=await api('subjectQs',{subject:sid,level:S.level,bank:true});const el=$('#qbs');if(!r.ok||!el)return;
  const n=r.questions.length;if(!n){el.textContent='Questions are on their way';return}
  const seen=bankSeen(),d=r.questions.filter(q=>seen[qid(q.lid,q)]!==undefined).length;
  el.textContent=`${d} of ${n} questions practised`}
async function bank(sid){
  const r=await api('subjectQs',{subject:sid,level:S.level,bank:true});if(!r.ok)return toast(r.error);
  const all=r.questions;if(all.length<3)return toast('The question bank is still being filled. Come back soon!');
  const seen=bankSeen(),s=subj(sid),N=10;
  const rank=q=>{const v=seen[qid(q.lid,q)];return v===undefined?0:v===0?1:2};
  const pick=(list,n)=>{const g=[[],[],[]];list.forEach(q=>g[rank(q)].push(q));return [].concat(...g.map(shuffle)).slice(0,n)};
  const mc=all.filter(q=>q.t==='mcq'),st=all.filter(q=>q.t==='st');
  let nst=Math.min(st.length,mc.length?Math.round(N*0.2):N),nmc=Math.min(mc.length,N-nst);nst=Math.min(st.length,N-nmc);
  const items=shuffle([...pick(mc,nmc).map(q=>({k:'mcq',q:shufMcq(q),lid:q.lid})),...pick(st,nst).map(q=>({k:'st',q,lid:q.lid}))]);
  const before=starsTotal();
  runQuiz({items,instant:true,onExit:()=>subject(sid),onDone:res=>{
    res.forEach(x=>{const full=x.it.k==='st'?x.s>=x.t:x.ok;bankSeen()[qid(x.it.lid,x.it.q)]=full?1:0});
    const mq=res.filter(x=>x.it.k==='mcq'),sq=res.filter(x=>x.it.k==='st'),mc_=mq.filter(x=>x.ok).length,ss=sq.reduce((a,x)=>a+x.s,0),stt=sq.reduce((a,x)=>a+x.t,0);
    const got=mc_+ss,tot=mq.length+stt,pct=tot?Math.round(100*got/tot):0;
    addMistakes(res);clearMistakes(res);touchStreak();queueSave();const gain=starsTotal()-before;
    const sn=bankSeen(),done=all.filter(q=>sn[qid(q.lid,q)]!==undefined).length,bp=Math.round(100*done/all.length);
    window.scrollTo(0,0);if(pct>=60){confetti();beep('win')}
    const wrong=res.filter(x=>x.it.k==='mcq'&&!x.ok);
    app.innerHTML=`<header class="hero" style="--brand:${s.c1};--brand2:${s.c2}"><div class="wrap"><h1>🎯 Question bank</h1><p class="lede">${s.title} · ${lvlName(S.level)}</p></div></header><main class="wrap"><div class="res"><div class="stars">${starRow(pct)}</div><div class="big">${pct}%</div><p><b>${pct>=80?'Brilliant work!':pct>=50?'Good effort!':'Keep practising, you can do it!'}</b>${gain>0?` +${gain} ⭐`:''}</p>
    <div class="chips" style="justify-content:center">${mq.length?`<span class="cchip">Multiple choice ${mc_}/${mq.length}</span>`:''}${stt?`<span class="cchip">Structured ${ss}/${stt}</span>`:''}</div>
    <div class="bankp"><div class="bankp-t"><span>Bank practised</span><b>${bp}%</b></div><div class="pbarw"><i style="width:${bp}%"></i></div><small class="hint">${done} of ${all.length} questions. New questions come up first.</small></div>
    <div class="actions" style="justify-content:center"><button class="btn primary" id="a">Practise 10 more 🔁</button><button class="btn" id="b">Back</button></div></div>
    ${wrong.length?`<div class="panel"><h3>Let's look at what you missed</h3>${wrong.map(x=>`<div class="ucard" style="display:block"><div class="rich">${rtInline(x.it.q.q)}</div><div class="hint">Answer: <b>${rtInline(x.it.q.o[x.it.q.c])}</b></div></div>`).join('')}</div>`:''}</main>${nav('home')}`;wireNav();$('#a').onclick=()=>bank(sid);$('#b').onclick=()=>subject(sid)}})}
function retryMistakes(){
  const m=(P().mistakes||[]).slice(0,15);if(!m.length)return toast('No mistakes to fix. 🎉');
  const items=m.map(x=>({k:x.k,q:x.q,lid:x.id.split('|')[0]}));
  runQuiz({items,instant:true,onExit:home,onDone:res=>{clearMistakes(res);queueSave();const c=res.filter(x=>x.ok).length;window.scrollTo(0,0);if(c)confetti();
    app.innerHTML=`<header class="hero"><div class="wrap"><h1>🛠️ Mistakes practice</h1></div></header><main class="wrap"><div class="res"><div class="big">${c}/${res.length}</div><p><b>${c===res.length?'All fixed! Amazing!':'Fixed '+c+'. Keep practising the rest.'}</b></p><div class="actions" style="justify-content:center"><button class="btn primary" id="a">${(P().mistakes||[]).length?'Practise more':'Done'}</button></div></div></main>${nav('home')}`;wireNav();$('#a').onclick=()=>(P().mistakes||[]).length?retryMistakes():home()}})}
/* ---- homework (learner) ---- */
const asgChip=s=>!s?'<span class="tag">Not handed in</span>':s.status==='marked'?`<span class="badge">Marked ${s.score}</span>`:s.status==='returned'?'<span class="badge d">Try again</span>':'<span class="badge a">Handed in</span>';
async function assignments(){
  window.scrollTo(0,0);stopSpeak();
  app.innerHTML=`<header class="hero"><div class="wrap"><h1>📬 My homework</h1><p class="lede">Do the work on paper, take clear photos, upload them, and your teacher will mark it and send feedback.</p></div></header><main class="wrap" id="al"><p>Loading…</p></main>${nav('asg')}`;wireNav();
  const r=await api('asgList'),al=$('#al');if(!al)return;if(!r.ok){al.innerHTML=`<div class="msg err">${esc(r.error)}</div>`;return}
  S.asgUnseen=r.assignments.filter(a=>a.sub&&a.sub.status==='marked'&&!a.sub.seen).length;
  al.innerHTML=r.assignments.length?`<div class="lessons">${r.assignments.map(a=>`<button class="lesson ${a.sub&&a.sub.status==='marked'?'read':''}" data-a="${a.id}"><span class="lno">${subj(a.subject).mas}</span><span><b>${esc(a.title)}</b><small>${esc(subj(a.subject).title)} · out of ${a.max}${a.due?' · due '+dueTxt(a.due):''}</small>${asgChip(a.sub)}${a.sub&&a.sub.status==='marked'&&!a.sub.seen?' <span class="tag new">New</span>':''}</span></button>`).join('')}</div>`:`<div class="panel soon"><div style="font-size:42px">🌤️</div><h3>No homework yet</h3><p class="hint">When your teacher sets some, it will show up here.</p></div>`;
  al.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>asgOpen(r.assignments.find(a=>a.id===b.dataset.a)))}
async function drawableOf(file){try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){}
  const url=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(new Error('read'));fr.readAsDataURL(file)});
  return await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('That picture could not be opened. Take the photo with your camera, or use a JPG or PNG picture.'));i.src=url})}
function encodeJpeg(src){const w0=src.width||src.naturalWidth,h0=src.height||src.naturalHeight;
  for(const [max,q] of [[1600,.72],[1400,.62],[1200,.55],[1000,.5],[800,.45]]){const sc=Math.min(1,max/Math.max(w0,h0)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w0*sc));c.height=Math.max(1,Math.round(h0*sc));const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(src,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',q);if(d.length<=900000)return d}
  throw new Error('That picture is too detailed to upload. Take it again from a little further away.')}
async function filesToPages(files,room){const out=[];
  for(const f of files){if(out.length>=room)break;
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){await loadScript(LIBS.pdf,()=>window.pdfjsLib);window.pdfjsLib.GlobalWorkerOptions.workerSrc=LIBS.worker[0];
      const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
      for(let p=1;p<=pdf.numPages&&out.length<room;p++){const pg=await pdf.getPage(p),v0=pg.getViewport({scale:1}),sc=Math.min(2,1600/Math.max(v0.width,v0.height)),vp=pg.getViewport({scale:sc}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;out.push(encodeJpeg(c))}}
    else out.push(encodeJpeg(await drawableOf(f)))}
  return out}
async function asgOpen(a){
  window.scrollTo(0,0);let pages=[],sub=a.sub;const locked=a.closed||(sub&&sub.status==='marked');
  app.innerHTML=`<header class="hero"><div class="wrap"><div class="topbar"><button class="btn sm" id="back">← Homework</button></div><h1>${subj(a.subject).mas} ${esc(a.title)}</h1><p class="lede">${esc(subj(a.subject).title)} · out of ${a.max}${a.due?' · due '+dueTxt(a.due):''}</p></div></header><main class="wrap">
  ${a.instructions?`<div class="panel"><h3>What to do</h3><div class="rich">${rich(a.instructions)}</div></div>`:''}<div class="panel" id="stat"></div><div class="panel" id="up"></div></main>${nav('asg')}`;wireNav();$('#back').onclick=assignments;
  const stat=$('#stat'),up=$('#up');
  const paintStatus=()=>{if(sub&&sub.status==='marked')stat.innerHTML=`<h3>Your mark</h3><div class="markbox"><div class="big">${sub.score}<small>/${a.max}</small></div><div><b>Teacher's feedback</b><div class="rich">${sub.feedback?rich(sub.feedback):'<p class="hint">No written feedback.</p>'}</div></div></div>`;
    else if(sub&&sub.status==='returned')stat.innerHTML=`<h3>Your teacher asked you to try again</h3><div class="rich">${rich(sub.feedback||'Please look at your work again and hand it in once more.')}</div>`;
    else if(sub)stat.innerHTML=`<h3>Handed in ✓</h3><p class="hint">Your teacher will mark it soon. You can replace your pages until it is marked.</p>`;
    else stat.innerHTML=`<h3>Not handed in yet</h3>${a.closed?'<p class="hint">This homework is closed.</p>':''}`};paintStatus();
  const paintUp=()=>{const gal=pages.length?`<div class="thumbs">${pages.map((d,i)=>`<figure><img src="${d}" alt="Page ${i+1}"><figcaption>Page ${i+1} ${locked?'':`<button class="link" data-rm="${i}">Remove</button>`}</figcaption></figure>`).join('')}</div>`:'<p class="hint">No pages yet.</p>';
    up.innerHTML=locked?`<h3>Your pages</h3>${gal}`:`<h3>${sub?'Replace your pages':'Hand in your work'}</h3><p class="hint">Up to 5 pages. Take clear photos in good light, with the whole page in view.</p>${gal}<div class="actions"><label class="btn primary" style="cursor:pointer">📷 Take or choose photos<input type="file" id="pf" accept="image/*,.pdf,application/pdf" multiple hidden></label><button class="btn good" id="send" ${pages.length?'':'disabled'}>⬆ Hand in (${pages.length} page${pages.length===1?'':'s'})</button></div><div id="um"></div>`;
    up.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{pages.splice(+b.dataset.rm,1);paintUp()});const pf=$('#pf');
    if(pf){pf.onchange=async()=>{const um=$('#um');um.innerHTML='<div class="msg okm">Getting your pages ready…</div>';try{const add=await filesToPages([...pf.files],5-pages.length);if(!add.length)throw new Error('You already have 5 pages. Remove one first.');pages=pages.concat(add);paintUp()}catch(e){um.innerHTML=`<div class="msg err">${esc(e.message||'Could not read that file.')}</div>`}};
      $('#send').onclick=async()=>{const b=$('#send');b.disabled=true;b.textContent='Sending…';const r=await api('asgSubmit',{aid:a.id,pages});if(!r.ok){$('#um').innerHTML=`<div class="msg err">${esc(r.error)}</div>`;b.disabled=false;b.textContent='⬆ Hand in';return}sub=a.sub=r.sub;confetti();toast('Handed in! Your teacher will mark it.',4500);paintStatus();paintUp()}}};
  if(sub){const r=await api('asgPages',{aid:a.id});if(r.ok)pages=r.pages||[]}paintUp();
  if(sub&&sub.status==='marked'&&!sub.seen){api('asgSeen',{aid:a.id});sub.seen=true;S.asgUnseen=Math.max(0,(S.asgUnseen||0)-1)}}
/* ---- me ---- */
function me(){
  window.scrollTo(0,0);stopSpeak();const n=starsTotal(),lv=levelOf(n);
  app.innerHTML=`<header class="hero"><div class="wrap"><h1>${lv.L[2]} ${esc(S.fullName||S.username)}</h1><p class="lede">${lv.L[1]} · ⭐ ${n} stars · 🔥 ${streakNow()} day streak</p></div></header><main class="wrap"><div class="panel"><h3>My class</h3>${levelPills()}</div><div class="panel"><h3>Pick your colours</h3><div class="themes">${[['sunny','☀️','linear-gradient(135deg,#ffe3a3,#6d3fe0)'],['candy','🍬','linear-gradient(135deg,#fbd0ee,#b01e95)'],['ocean','🌊','linear-gradient(135deg,#b8e4ff,#0b6fc2)'],['jungle','🌴','linear-gradient(135deg,#c7efb5,#1f8a3b)']].map(([t,e,g])=>`<button class="th ${S.theme===t?'on':''}" data-th="${t}" style="background:${g}" aria-label="${t} theme">${e}</button>`).join('')}</div></div>
  <div class="panel"><h3>Sounds</h3><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="snd" style="width:auto" ${S.sound?'checked':''}> Play happy sounds when I answer</label></div>
  <div class="panel"><h3>Badges</h3><div class="chips">${LEVELS.map(l=>`<span class="cchip ${n>=l[0]?'ok':''}">${l[2]} ${l[1]} · ${l[0]}⭐</span>`).join('')}</div></div>
  <div class="actions"><button class="btn danger" id="so">Sign out</button></div><p class="hint">${APP_NAME} ${APP_VERSION}</p></main>${nav('me')}`;wireNav();wireLevel(me);
  app.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.th);queueSave();me()});$('#snd').onchange=e=>{S.sound=e.target.checked;lsSet('bpz_snd',S.sound?'1':'0');beep('ok')};$('#so').onclick=signOut}
