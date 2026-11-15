const APP_VERSION='v1.3',APP_NAME='BECE Prep Zone';
const LIBS={mammoth:['/vendor/mammoth.browser.min.js'],pdf:['/vendor/pdf.min.js'],worker:['/vendor/pdf.worker.min.js']};
const DECO={sci:['⚗️','🧪','🔭','⚛️','🧬','🌱','💡','🔬'],math:['➕','➗','✖️','📐','🔢','📏','🧮','⭐'],ga:['🥁','🎶','📖','✍️','🌍','🎵','🪘','⭐'],comp:['💻','🖱️','⌨️','🤖','💡','📡','🧩','⭐'],home:['⭐','🚀','🌈','📚','🎈','✨','🧠','🏆']};
const deco=(k,soft)=>`<div class="deco${soft?' soft':''}" aria-hidden="true">${(DECO[k]||DECO.home).map(e=>`<i>${e}</i>`).join('')}</div>`;
const SUBJ=[{id:'sci',title:'Integrated Science',mas:'🔬',c1:'#0f9d58',c2:'#34d3a0',desc:'Explore how the world works!'},{id:'math',title:'Mathematics',mas:'🧮',c1:'#e8477a',c2:'#ff9a5a',desc:'Numbers, shapes and puzzles!'},{id:'ga',title:'Ghanaian Language (Ga)',mas:'🥁',c1:'#6d3fe0',c2:'#b07cff',desc:'Speak, read and write Ga!'},{id:'comp',title:'Computing',mas:'💻',c1:'#0ea5e9',c2:'#6366f1',desc:'Computers, coding and the digital world!'}];
const LVL=[['b7','Basic 7'],['b8','Basic 8'],['b9','Basic 9']],lvlName=id=>(LVL.find(l=>l[0]===id)||LVL[0])[1];
const subj=id=>SUBJ.find(s=>s.id===id)||SUBJ[0];
const $=s=>document.querySelector(s),app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const S={level:lsGet('bpz_lv')||'b7',token:lsGet('bpz_t')||'',role:'',username:'',fullName:'',theme:lsGet('bpz_th')||'sunny',progress:{},pe:0,settings:{mockq:30,mockt:45},asgUnseen:0,pending:0,lessons:[],sound:lsGet('bpz_snd')!=='0',listen:true};
function setTheme(t){S.theme=t;document.documentElement.dataset.theme=t;lsSet('bpz_th',t)}setTheme(S.theme);
async function api(action,body={}){
  try{const r=await fetch('/api',{method:'POST',headers:{'content-type':'application/json',...(S.token?{authorization:'Bearer '+S.token}:{})},body:JSON.stringify({action,...body})});
    const j=await r.json().catch(()=>({ok:false,error:'The server sent something unexpected. Please try again.'}));
    if(r.status===401&&S.token&&action!=='login'){signOutLocal();showAuth('Please sign in again.')}return j}
  catch(e){return{ok:false,error:'No internet connection. Please check and try again.'}}}
let tt;function toast(m,ms=2600){let t=$('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast';t.textContent=m;t.setAttribute('role','status');document.body.appendChild(t);clearTimeout(tt);tt=setTimeout(()=>t.remove(),ms)}
function loadScript(list,test){return new Promise((res,rej)=>{if(test&&test())return res();let i=0;const go=()=>{if(i>=list.length)return rej(new Error('Could not load a helper file.'));const s=document.createElement('script');s.src=list[i++];s.onload=()=>res();s.onerror=go;document.head.appendChild(s)};go()})}
/* ---- rich text: **bold**, ==highlight==, ^{sup}, _{sub}, [[a/b]], sqrt{x}, "## heading", "- bullet", "1. step", "> tip" ---- */
function rtInline(s){let t=esc(s);
  t=t.replace(/\[\[pic:([^\]]*)\]\]/g,(m,d)=>S.role==='admin'?`<span class="picslot">🖼 Picture goes here: ${d.trim()}</span>`:'');
  t=t.replace(/\[\[img:([a-z0-9]+)(?:\|([^\]]*))?\]\]/gi,(m,id,c)=>`<span class="figw"><img class="pic" data-pic="${id}" alt="${(c||'Picture').replace(/"/g,'')}">${c?`<span class="cap">${c}</span>`:''}</span>`);
  t=t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/==(.+?)==/g,'<mark class="hl">$1</mark>');
  t=t.replace(/\^\{([^{}]*)\}/g,'<sup>$1</sup>').replace(/_\{([^{}]*)\}/g,'<sub>$1</sub>');
  t=t.replace(/\[\[([^\[\]\/]+)\/([^\[\]\/]+)\]\]/g,'<span class="frac"><span>$1</span><span>$2</span></span>');
  return t.replace(/sqrt\{([^{}]*)\}/g,'√<span class="rad">$1</span>')}
function rich(s){const out=[];let list=null,tbl=null;const flushT=()=>{if(tbl&&tbl.length){out.push('<div class="tw"><table><thead><tr>'+tbl[0].map(c=>`<th>${rtInline(c)}</th>`).join('')+'</tr></thead><tbody>'+tbl.slice(1).map(r=>'<tr>'+r.map(c=>`<td>${rtInline(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>')}tbl=null};const close=()=>{if(list){out.push('</'+list+'>');list=null}if(tbl&&!/^\|/.test(cur))flushT()};let cur='';
  String(s||'').replace(/\r/g,'').split('\n').forEach(raw=>{const l=raw.trimEnd();let m;cur=l;
    if(!l.trim()){close();return}
    if((m=l.match(/^(#{1,3})\s+(.*)$/))){close();const n=m[1].length+1;out.push(`<h${n} class="rh">${rtInline(m[2])}</h${n}>`);return}
    if((m=l.match(/^[-•*]\s+(.*)$/))){if(list!=='ul'){close();out.push('<ul>');list='ul'}out.push(`<li>${rtInline(m[1])}</li>`);return}
    if((m=l.match(/^(\d{1,2})[.)]\s+(.*)$/))){if(list!=='ol'){close();out.push(`<ol start="${m[1]}">`);list='ol'}out.push(`<li>${rtInline(m[2])}</li>`);return}
    if((m=l.match(/^>\s*(.*)$/))){close();const em=/^\p{Extended_Pictographic}/u.test(m[1]);out.push(`<div class="callout${/^🧪/u.test(m[1])?' try':/^🎯/u.test(m[1])?' goal':/^🤔|^✨/u.test(m[1])?' know':''}">${em?'':'💡 '}${rtInline(m[1])}</div>`);return}
    if(/^\|.*\|\s*$/.test(l)){close();tbl=tbl||[];if(!/^\|[\s:|-]+\|$/.test(l))tbl.push(l.replace(/^\||\|\s*$/g,'').split('|').map(x=>x.trim()));return}
    close();out.push(`<p>${rtInline(l)}</p>`)});
  cur='';close();flushT();return out.join('')}
const plain=s=>String(s||'').replace(/\[\[(?:img|pic):[^\]]*\]\]/gi,' ').replace(/^\|.*\|$/gm,' ').replace(/\*\*|==/g,'').replace(/^#+\s*/gm,'').replace(/^>\s*/gm,'').replace(/\^\{([^{}]*)\}/g,' to the power $1 ').replace(/_\{([^{}]*)\}/g,' $1 ').replace(/\[\[([^\[\]\/]+)\/([^\[\]\/]+)\]\]/g,' $1 over $2 ').replace(/sqrt\{([^{}]*)\}/g,' square root of $1 ');
/* ---- pictures are stored separately and loaded when they appear ---- */
const PIC=new Map();
async function loadPic(img){const id=img.dataset.pic;if(!id||img.dataset.done)return;img.dataset.done='1';if(!PIC.has(id))PIC.set(id,api('imgGet',{id}).then(r=>r.ok?r.d:''));const d=await PIC.get(id);if(d)img.src=d;else img.closest('.figw')&&img.closest('.figw').classList.add('hide')}
new MutationObserver(()=>app.querySelectorAll('img[data-pic]:not([data-done])').forEach(loadPic)).observe(app,{childList:true,subtree:true});
/* ---- progress, stars, streak, levels ---- */
const pad2=n=>String(n).padStart(2,'0'),dayKey=d=>{d=d||new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
const yKey=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayKey(d)};
const P=()=>S.progress;
const rec=id=>{const l=(P().lessons=P().lessons||{});return l[id]=l[id]||{}};
function touchStreak(){const s=P().streak=P().streak||{d:'',n:0},t=dayKey();if(s.d===t)return;s.n=s.d===yKey()?(s.n||0)+1:1;s.d=t}
const streakNow=()=>{const s=P().streak||{};return s.n&&(s.d===dayKey()||s.d===yKey())?s.n:0};
function starsTotal(){let n=0;for(const r of Object.values(P().lessons||{}))n+=(r.read?2:0)+((r.b&&r.b.mcq)||0)+((r.b&&r.b.fib)||0)+((r.b&&r.b.st)||0);for(const m of Object.values(P().mock||{}))n+=Math.floor((m.best||0)/2);return n}
const LEVELS=[[0,'Explorer','🌱'],[40,'Learner','📘'],[120,'Scholar','🎓'],[300,'Champion','🏆'],[600,'Super Star','🌟']];
function levelOf(n){let i=0;LEVELS.forEach((L,k)=>{if(n>=L[0])i=k});const L=LEVELS[i],nx=LEVELS[i+1]||null;return{L,nx,pct:nx?Math.round(100*(n-L[0])/(nx[0]-L[0])):100}}
let saveT=null;function queueSave(){if(S.role!=='user')return;P().stars=starsTotal();clearTimeout(saveT);saveT=setTimeout(saveNow,1200)}
async function saveNow(){if(S.role!=='user'||!S.token)return;clearTimeout(saveT);const r=await api('saveState',{progress:P(),theme:S.theme,pe:S.pe});if(r&&r.stale){S.progress={};S.pe=r.pe||0;toast('Your teacher reset your progress. Fresh start!')}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});
function confetti(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const box=document.createElement('div');box.className='confetti';box.setAttribute('aria-hidden','true');const E=['🎉','⭐','✨','🌟','🎊','🏅'];
  for(let i=0;i<26;i++){const s=document.createElement('span');s.textContent=E[i%E.length];s.style.left=(Math.random()*100)+'vw';s.style.animationDelay=(Math.random()*.8)+'s';s.style.fontSize=(18+Math.random()*18)+'px';box.appendChild(s)}
  document.body.appendChild(box);setTimeout(()=>box.remove(),3600)}
let AC=null;function beep(kind){if(!S.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const seq=kind==='ok'?[[660,0],[880,.12]]:kind==='win'?[[523,0],[659,.12],[784,.24],[1046,.36]]:[[220,0]];seq.forEach(([f,t])=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type='triangle';g.gain.setValueAtTime(.12,AC.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+t+.25);o.connect(g);g.connect(AC.destination);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+.26)})}catch(e){}}
/* ---- listen (text to speech) ---- */
const canSpeak=()=>'speechSynthesis' in window;
function speak(text){if(!canSpeak())return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(plain(text));u.rate=.92;speechSynthesis.speak(u)}
const stopSpeak=()=>{if(canSpeak())speechSynthesis.cancel()};
const dueTxt=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'})}catch(e){return d}};
const fmtD=t=>{try{return new Date(t).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return''}};
/* ---- auth ---- */
function signOutLocal(){stopSpeak();S.token='';S.role='';S.progress={};lsSet('bpz_t',null)}
function showAuth(note){
  S.token='';document.body.style.paddingBottom='0';let tab='in',need=false;
  const paint=(msg,cls)=>{
    app.innerHTML=`<div class="auth"><div class="authbox"><div class="authhead"><div class="mascot" aria-hidden="true">🦉</div><h1>${APP_NAME}</h1><p class="hint">Learn, play and get ready for BECE!</p></div>
    <div class="panel"><div class="tabs" role="tablist"><button class="${tab==='in'?'on':''}" data-t="in">Sign in</button><button class="${tab==='up'?'on':''}" data-t="up">New learner</button></div>
    ${note?`<div class="msg err">${esc(note)}</div>`:''}
    ${tab==='in'?`<form id="f"><label class="f">Username<input id="u" autocomplete="username" autocapitalize="none" required></label><label class="f">Password<input id="p" type="password" autocomplete="current-password" required></label>${need?'<label class="f">6-digit code (administrator)<input id="c" inputmode="numeric" autocomplete="one-time-code"></label>':''}<div class="actions"><button class="btn primary big" style="width:100%">Let's go! 🚀</button></div><p class="hint" style="text-align:center"><button type="button" class="link" id="fg">Forgot my password</button></p></form>`
    :`<form id="f"><label class="f">Learner's full name<input id="n" autocomplete="name" required></label><label class="f">Choose a username<input id="u" autocapitalize="none" autocomplete="username" required><span class="hint">Letters, numbers, dot or underscore (3 to 30).</span></label><label class="f">Class<select id="lv">${LVL.map(l=>`<option value="${l[0]}">${l[1]}</option>`).join('')}</select></label><label class="f">Parent or guardian's phone<input id="ph" type="tel" autocomplete="tel" required></label><label class="f">Choose a password<input id="p" type="password" autocomplete="new-password" required><span class="hint">At least 8 characters.</span></label><div class="actions"><button class="btn primary big" style="width:100%">Join the fun! 🎉</button></div><p class="hint">Your teacher will approve your account before you can start.</p></form>`}
    <div id="m">${msg?`<div class="msg ${cls}">${esc(msg)}</div>`:''}</div></div><p class="hint" style="text-align:center">${APP_NAME} ${APP_VERSION}</p></div></div>`;
    app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;note='';need=false;paint()});
    const fg=$('#fg');if(fg)fg.onclick=async()=>{const u=$('#u').value.trim();if(!u)return paint('Type your username first, then press this again.','err');await api('requestReset',{username:u});paint('Your teacher has been told. They will give you a new password.','okm')};
    $('#f').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button.primary');b.disabled=true;
      if(tab==='in'){const r=await api('login',{username:$('#u').value,password:$('#p').value,code:need?$('#c').value:''});
        if(r.needCode){need=true;return paint(r.error,'err')}
        if(!r.ok){b.disabled=false;return paint(r.error,'err')}
        S.token=r.token;lsSet('bpz_t',r.token);return boot()}
      const r=await api('register',{fullName:$('#n').value,username:$('#u').value,phone:$('#ph').value,level:$('#lv').value,password:$('#p').value});
      if(!r.ok){b.disabled=false;return paint(r.error,'err')}
      tab='in';paint('Done! Your teacher will approve your account soon. Then you can sign in.','okm')}};
  paint()}
async function boot(){
  if(!S.token)return showAuth();
  const r=await api('me');if(!r.ok){if(!S.token)return;return showAuth(r.error)}
  if(r.level){S.level=r.level;lsSet('bpz_lv',r.level)}Object.assign(S,{role:r.role,username:r.username,fullName:r.fullName,progress:r.progress||{},pe:r.pe||0,settings:r.settings,asgUnseen:r.asgUnseen||0,pending:r.pending||0,twoStep:r.twoStep,vaultSet:r.vaultSet});
  if(r.role==='user')setTheme(r.theme||'sunny');else setTheme('sunny');
  if(S.role==='admin')return adminHome();
  touchStreak();queueSave();home()}
async function signOut(){await saveNow();await api('logout');signOutLocal();showAuth()}
/* ---- shell ---- */
function nav(active){const n=S.asgUnseen||0;return `<nav class="bnav" aria-label="Main"><button data-go="home" class="${active==='home'?'on':''}"><span class="em">🏠</span>Home</button><button data-go="asg" class="${active==='asg'?'on':''}"><span class="em">📬</span>Homework${n?`<span class="dot">${n}</span>`:''}</button><button data-go="me" class="${active==='me'?'on':''}"><span class="em">⚙️</span>Me</button></nav>`}
function wireNav(){app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{stopSpeak();const g=b.dataset.go;g==='home'?home():g==='asg'?assignments():me()})}
function firstName(){return (S.fullName||S.username).split(/\s+/)[0]}
async function loadLessons(){const r=await api('lessonList');S.lessons=r.ok?r.lessons:[];return r.ok}
/* ---- home ---- */
const EM=['🌟','🔎','💡','🧪','🚀','🎯','🌈','🧩'];
const lvlOf=l=>l.level||'b7';
const mine=()=>S.lessons.filter(l=>lvlOf(l)===S.level);
const doneL=l=>!!((P().lessons||{})[l.id]&&P().lessons[l.id].read);
function levelPills(){return `<div class="pills" role="tablist" aria-label="Class">${LVL.map(l=>`<button class="pill ${S.level===l[0]?'on':''}" data-lv="${l[0]}">${l[1]}</button>`).join('')}</div>`}
function wireLevel(after){app.querySelectorAll('[data-lv]').forEach(b=>b.onclick=async()=>{S.level=b.dataset.lv;lsSet('bpz_lv',S.level);api('setLevel',{level:S.level});after()})}
async function home(){
  window.scrollTo(0,0);stopSpeak();document.body.style.paddingBottom='70px';
  const [,mr]=await Promise.all([loadLessons(),api('me')]);if(mr&&mr.ok)S.asgUnseen=mr.asgUnseen||0;
  const n=starsTotal(),lv=levelOf(n),sk=streakNow(),mis=(P().mistakes||[]).length;
  app.innerHTML=`<header class="hero">${deco('home')}<div class="wrap"><div class="herorow"><div class="mascot" aria-hidden="true">🦉</div><div style="flex:1"><h1>Hi ${esc(firstName())}! 👋</h1><p class="lede">${sk>1?`${sk} days in a row! Keep your streak going.`:'Pick a subject and start your adventure.'}</p></div></div>
  <div class="stats"><div class="stat"><b>⭐ ${n}</b><small>stars</small></div><div class="stat"><b>🔥 ${sk}</b><small>day streak</small></div><div class="stat lvl"><b>${lv.L[2]} ${lv.L[1]}</b><small>${lv.nx?`${lv.nx[0]-n} stars to ${lv.nx[1]}`:'Top level!'}</small><span class="sprog"><i style="width:${lv.pct}%"></i></span></div></div></div></header>
  <main class="wrap">${levelPills()}<div class="subjgrid">${SUBJ.map(s=>{const ls=mine().filter(l=>l.subject===s.id&&l.kind!=='test'&&l.kind!=='bank'),done=ls.filter(doneL).length;return `<button class="subj" data-s="${s.id}" style="--c1:${s.c1};--c2:${s.c2}"><span class="mas" aria-hidden="true">${s.mas}</span><span class="sbody"><b>${s.title}</b><small>${s.desc}</small><span class="chips"><span class="cchip">${ls.length?`${done}/${ls.length} mini-lessons`:'Coming soon'}</span></span></span><span aria-hidden="true" style="font-size:24px">▶</span></button>`}).join('')}</div>
  <div class="tiles"><button class="tile" id="tm"><span class="tic">🛠️</span><b>Fix my mistakes</b><small>${mis?mis+' to practise':'Nothing to fix. Great!'}</small></button><button class="tile" data-go="asg"><span class="tic">📬</span><b>Homework</b><small>${S.asgUnseen?S.asgUnseen+' new mark'+(S.asgUnseen>1?'s':''):'Hand in your work'}</small></button></div></main>${nav('home')}`;
  wireNav();wireLevel(home);app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>subject(b.dataset.s));$('#tm').onclick=()=>mis?retryMistakes():toast('No mistakes to fix yet. 🎉')}
function topicsOf(sid){const ls=mine().filter(l=>l.subject===sid&&l.kind!=='bank'),map=new Map();ls.forEach(l=>{const t=l.topic||'More lessons';if(!map.has(t))map.set(t,[]);map.get(t).push(l)});return [...map.entries()].sort((x,y)=>x[0].localeCompare(y[0],undefined,{numeric:true})).map(([t,items])=>({t,learn:items.filter(x=>x.kind!=='test'),test:items.filter(x=>x.kind==='test')}))}
const OPEN_T=new Set();
async function subject(id){
  window.scrollTo(0,0);stopSpeak();const s=subj(id);await loadLessons();
  const tp=topicsOf(id),total=tp.reduce((a,t)=>a+t.learn.length,0);
  if(!OPEN_T.size){const first=tp.find(t=>t.learn.some(l=>!doneL(l)))||tp[0];if(first)OPEN_T.add(first.t)}
  app.innerHTML=`<header class="hero" style="--brand:${s.c1};--brand2:${s.c2}">${deco(s.id)}<div class="wrap"><div class="topbar"><button class="btn sm" id="bk">← Home</button></div><div class="herorow"><div class="mascot" aria-hidden="true">${s.mas}</div><div><h1>${s.title}</h1><p class="lede">${lvlName(S.level)} · ${total?`${tp.length} topic${tp.length>1?'s':''}, ${total} mini-lessons`:s.desc}</p></div></div></div></header>
  <main class="wrap">${levelPills()}${tp.length?tp.map((t,ti)=>{const dn=t.learn.filter(doneL).length,pct=t.learn.length?Math.round(100*dn/t.learn.length):0;return `<details class="topic" data-t="${esc(t.t)}" ${OPEN_T.has(t.t)?'open':''}><summary><span class="tdot" style="background:linear-gradient(130deg,${s.c1},${s.c2})">${dn===t.learn.length&&t.learn.length?'✓':ti+1}</span><span class="ttxt"><b>${esc(t.t)}</b><small>${dn}/${t.learn.length} done${t.test.length?' · topic test':''}</small><span class="tbar"><i style="width:${pct}%"></i></span></span></summary>
  <div class="path">${t.learn.map((l,i)=>{const r=(P().lessons||{})[l.id]||{};return `<button class="step ${r.read?'read':''}" data-l="${l.id}"><span class="sno">${r.read?'✓':esc(l.emoji||EM[i%EM.length])}</span><span class="stx"><b>${esc(l.title)}</b><small>${l.np} card${l.np>1?'s':''} · about ${Math.max(1,l.np)} min${l.nq?` · quick check`:''}</small></span></button>`}).join('')}
  ${t.test.map(l=>{const r=(P().lessons||{})[l.id]||{},b=r.b||{},st=(b.mcq||0)+(b.fib||0)+(b.st||0);return `<button class="step test ${r.read?'read':''}" data-l="${l.id}"><span class="sno">🏆</span><span class="stx"><b>${esc(l.title)}</b><small>${l.nq} question${l.nq===1?'':'s'}${st?` · best ⭐ ${st}`:''}</small></span></button>`}).join('')}</div></details>`}).join('')+`<div class="tiles" style="margin:18px 0 30px"><button class="tile" id="qb"><span class="tic">🎯</span><b>Question bank</b><small id="qbs">Random practice questions</small></button><button class="tile" id="mk"><span class="tic">⏱️</span><b>Subject challenge</b><small>A timed mix of questions</small></button></div>`
  :`<div class="panel soon"><div style="font-size:54px">🚧</div><h3>Lessons are on their way!</h3><p class="hint">Your teacher is getting ${esc(s.title)} for ${lvlName(S.level)} ready. Come back soon.</p></div>`}</main>${nav('home')}`;
  wireNav();wireLevel(()=>{OPEN_T.clear();subject(id)});$('#bk').onclick=home;
  app.querySelectorAll('details.topic').forEach(d=>d.ontoggle=()=>{d.open?OPEN_T.add(d.dataset.t):OPEN_T.delete(d.dataset.t)});
  app.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>openLesson(b.dataset.l));const mk=$('#mk');if(mk)mk.onclick=()=>mock(id);const qb=$('#qb');if(qb){qb.onclick=()=>bank(id);bankInfo(id)}}
/* ---- lesson reader: short, colourful cards ---- */
const CARD=['#6d3fe0','#e8477a','#0a9b7a','#e07a00','#0b6fc2','#b01e95'];
async function openLesson(id,pg){
  const r=await api('lessonGet',{id});if(!r.ok){toast(r.error);return}
  const L=r.lesson,s=subj(L.subject);window.scrollTo(0,0);
  if(L.kind==='test'||!L.pages.length)return lessonTest(L);
  let i=pg||0;const pages=L.pages,sib=S.lessons.filter(x=>x.subject===L.subject&&lvlOf(x)===lvlOf(L)&&(x.topic||'')===(L.topic||'')),at=sib.findIndex(x=>x.id===L.id),nextL=sib.slice(at+1).find(x=>x.kind!=='test'),testL=sib.find(x=>x.kind==='test');
  const paint=()=>{const p=pages[i],last=i===pages.length-1,col=CARD[(at+i)%CARD.length];
    app.innerHTML=`<header class="hero" style="--brand:${s.c1};--brand2:${s.c2}">${deco(s.id,1)}<div class="wrap"><div class="topbar"><button class="btn sm" id="bk">← ${esc(L.topic||s.title)}</button>${canSpeak()?'<button class="btn sm" id="ls">🔊 Listen</button>':''}</div><h1>${esc(L.emoji)} ${esc(L.title)}</h1><div class="lpb" aria-label="Page ${i+1} of ${pages.length}">${pages.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div></div></header>
    <main class="wrap"><article class="reader card" id="rd" style="--cc:${col}" aria-live="polite">${p.title?`<h2>${esc(p.title)}</h2>`:''}<div class="rich">${rich(p.body)}</div></article>
    <div class="actions" style="justify-content:space-between"><button class="btn" id="pv" ${i?'':'disabled'}>◀ Back</button>${last?'':'<button class="btn primary big" id="nx">Next ▶</button>'}</div>
    ${last?`<div class="res" id="fin"><div class="stars">⭐⭐</div><h3>Mini-lesson done!</h3><div class="actions" style="justify-content:center">${L.questions.length?'<button class="btn primary big" id="go">Quick check 🚀</button>':''}${nextL?`<button class="btn ${L.questions.length?'':'primary big'}" id="nl">Next mini-lesson ▶</button>`:testL?'<button class="btn primary big" id="tt">Take the topic test 🏆</button>':''}<button class="btn" id="bk2">Back to the path</button></div></div>`:''}</main>`;
    $('#bk').onclick=()=>{stopSpeak();subject(L.subject)};const ls=$('#ls');if(ls)ls.onclick=()=>speak((p.title?p.title+'. ':'')+p.body);
    $('#pv').onclick=()=>{stopSpeak();i--;paint();window.scrollTo(0,0)};const nx=$('#nx');if(nx)nx.onclick=()=>{stopSpeak();i++;paint();window.scrollTo(0,0)};
    if(last){const rc=rec(L.id);if(!rc.read){rc.read=true;touchStreak();queueSave();beep('ok');confetti();toast('⭐⭐ +2 stars for reading!')}
      const g=$('#go');if(g)g.onclick=()=>{stopSpeak();lessonTest(L)};const nl=$('#nl');if(nl)nl.onclick=()=>{stopSpeak();openLesson(nextL.id)};const tt=$('#tt');if(tt)tt.onclick=()=>{stopSpeak();openLesson(testL.id)};$('#bk2').onclick=()=>{stopSpeak();subject(L.subject)}}
    let x0=null;const rd=$('#rd');rd.ontouchstart=e=>{x0=e.touches[0].clientX};rd.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)<70)return;if(dx<0&&i<pages.length-1){stopSpeak();i++;paint()}else if(dx>0&&i>0){stopSpeak();i--;paint()}}};
  paint()}
