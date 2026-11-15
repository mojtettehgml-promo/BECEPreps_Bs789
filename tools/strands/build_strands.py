import json,re,sys,html,importlib.util,os,math,collections,copy
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
STOP=set("the a an of to and in is are as for it its by on at with that this from or be can has have not only mainly best most which what when how their they them also into than then used use one two three your you will would should could about because between each other such these those there where while after before during over under more less very much many some any all both if so do does did was were been being his her he she we our us i me my who whom whose why name state explain describe give list define write say show suggest choose using use".split())
def norm(t): return re.sub(r'[^a-z0-9 ]+','',html.unescape(t).lower().replace('-',' ')).strip()
def toks(t): return [w for w in re.findall(r'[a-z0-9]+',norm(t)) if len(w)>3 and w not in STOP]
def stem(w): return re.sub(r'(ies|es|s|ing|ed|ly)$','',w) if len(w)>5 else w
def text_of(L): return ' '.join((p['title']+' '+p['body']) for p in L['pages'])
def sentences(t):
    t=re.sub(r'\[\[(img|pic):[^\]]*\]\]','',t).replace('**','').replace('|',' ')
    lines=[re.sub(r'^[-> #]+','',l).strip() for l in t.split('\n')]
    return [x.strip() for l in lines for x in re.split(r'(?<=[.!?])\s+',l) if len(x.strip())>30]
def clip(s,n=230):
    if len(s)<=n: return s
    return s[:n].rsplit(' ',1)[0]+'…'
def load_data(id_):
    p=os.path.join(HERE,'data',id_+'.py')
    if not os.path.exists(p): return None
    sp=importlib.util.spec_from_file_location('d'+id_.replace('.','_'),p); m=importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
def build(id_,verbose=True):
    r=json.load(open(os.path.join(HERE,'raw',id_+'.json'))); D=load_data(id_)
    if D is None: return None
    QA=getattr(D,'QA',[]); MCKEY=getattr(D,'MCKEY',{}); TITLES=getattr(D,'TITLES',{}); DROP=set(getattr(D,'DROP',[])); HOME=getattr(D,'HOME',{})
    L=r['lessons']; learn=[i for i,l in enumerate(L) if l['kind']=='learn' and i not in DROP and l['title'] not in('Quick recap','Word bank')]
    body={i:text_of(L[i]) for i in learn}
    allsent=[(i,s) for i in learn for s in sentences(body[i])]
    df=collections.Counter(w for i in learn for w in set(map(stem,toks(body[i]))))
    N=max(1,len(learn)); idf=lambda w:math.log(1+N/(1+df.get(w,0)))
    ltok={i:collections.Counter(map(stem,toks(body[i]))) for i in learn}
    def best_lesson(q,ans,cands):
        qt=[stem(w) for w in toks(q+' '+ans)]; best=None
        for i in cands:
            sc=sum(idf(w)*min(3,ltok[i][w]) for w in set(qt) if w in ltok[i])
            if best is None or sc>best[0]: best=(sc,i)
        return best[1] if best and best[0]>0 else None
    def find(prefix_list,qtext):
        n=norm(qtext)
        for a in QA:
            if n.startswith(norm(a['prefix'])): return a
        return None
    dropped=[];kept=0
    pool=[]   # (question, home candidate lessons list or None, from_test)
    newq={i:[] for i in range(len(L))}
    test_i=next((i for i,l in enumerate(L) if l['kind']=='test'),None)
    def conv(q):
        if q['t']=='mcq':
            q=copy.deepcopy(q)
            SUP=str.maketrans({'⁰':'^0','¹':'^1','²':'^2','³':'^3','⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9'})
            q['o']=[re.sub(r'\^(\d)\^(\d)',r'^\1\2',o.translate(SUP)) for o in q['o']]
            if q.get('nokey'):
                k=None
                for pre,letter in MCKEY.items():
                    if norm(q['q']).startswith(norm(pre)): k='ABCDE'.index(letter)
                if k is None: dropped.append('MC '+q['q'][:60]); return None
                q['c']=k
            q.pop('nokey',None)
            qa=set(stem(w) for w in toks(q['q']+' '+q['o'][q['c']]))
            if allsent:
                ev=max(allsent,key=lambda x:sum(idf(w) for w in qa if w in set(map(stem,toks(x[1])))))
                q['e']=clip(ev[1])
            return q
        if q['t']=='st':
            a=find(None,q['q'])
            if not a: dropped.append('ST '+q['q'][:70]); return None
            q=copy.deepcopy(q)
            if len(q['parts'])!=len(a['parts']):
                if len(a['parts'])==1 and len(q['parts'])>1: dropped.append('PARTS '+q['q'][:60]); return None
                if len(q['parts'])==1: q['parts']=[q['parts'][0]]*len(a['parts'])
            for p,(m,model,ideas) in zip(q['parts'],a['parts']): p['m']=m;p['a']=model;p['ideas']=ideas
            return q
        return None
    for i,l in enumerate(L):
        for q in l['questions']:
            c=conv(q)
            if not c: continue
            kept+=1
            if l['kind']=='test': pool.append((c,None))
            elif l.get('segId') is not None:
                pool.append((c,l['segId']))
            else: newq[i].append(c)
    # place pooled questions
    seg_of={i:L[i].get('segId') for i in learn}
    for c,seg in pool:
        cands=[i for i in learn if seg is None or seg_of[i]==seg] or learn
        ans=' '.join(p['a'] for p in c.get('parts',[])) if c['t']=='st' else c['o'][c['c']]
        i=best_lesson(c['q'],ans,cands)
        if i is not None: newq[i].append(c)
    # topic test: every question
    allq=[]; seen=set()
    for i in range(len(L)):
        for c in newq[i]:
            k=norm(c['q'])
            if k not in seen: seen.add(k); allq.append(c)
    out=[]
    for i,l in enumerate(L):
        if i in DROP: continue
        l=copy.deepcopy(l); l['questions']=[] if l['kind']=='test' else newq[i]
        if i in TITLES: l['title']=TITLES[i]
        l.pop('segId',None); l['status']='published'; out.append((i,l))
    # dedupe inside lesson
    for i,l in out:
        s2=set();u=[]
        for q in l['questions']:
            k=norm(q['q'])
            if k in s2: continue
            s2.add(k);u.append(q)
        l['questions']=u
    tl=[l for i,l in out if l['kind']=='test']
    if tl: tl[0]['questions']=allq
    elif allq:
        base=out[0][1]; out.append((999,{'subject':base['subject'],'level':base['level'],'topic':base['topic'],'kind':'test','title':'Topic test','emoji':'🏆','order':900,'status':'published','pages':[],'questions':allq,'source':base['source']}))
    lessons=[l for i,l in out]
    for n,l in enumerate(lessons): l['id']='b7-%s-%02d'%(id_,n+1)
    # drop learn lessons that ended up empty
    stats=dict(mini=sum(l['kind']=='learn' for l in lessons),mcq=sum(q['t']=='mcq' for q in allq),st=sum(q['t']=='st' for q in allq),dropped=len(dropped))
    if verbose:
        print(id_,stats)
        for d in dropped: print('   dropped:',d)
        for l in lessons:
            if l['kind']=='learn': print('   %-44s cards %d  q %d'%(l['title'][:44],len(l['pages']),len(l['questions'])))
    return lessons,r['images'],stats
if __name__=='__main__':
    for id_ in sys.argv[1:]: build(id_)
