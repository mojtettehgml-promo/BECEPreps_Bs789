"""Answers worked out from the reading notes themselves (no outside facts).
 - key_mcq(): picks the option that the notes support; returns None when not clear enough.
 - answer_st(): returns (marks, model answer, ideas) built from the notes sentences that best match the question; None when not clear."""
import re,math,collections,html
STOP=set("the a an of to and in is are as for it its by on at with that this from or be can has have not only mainly best most which what when how their they them also into than then used use one two three four five six your you will would should could about because between each other such these those there where while after before during over under more less very much many some any all both if so do does did was were been being his her he she we our us i me my who whom whose why name state explain describe give list define write say show suggest choose using main example examples way ways thing things called known".split())
CMD=set("name state explain describe give list define write why how what which describe compare discuss suggest recommend identify outline mention state differences difference similarities similarity reasons reason".split())
def norm(t): return re.sub(r'[^a-z0-9 ]+',' ',html.unescape(t).lower().replace('-',' '))
def stem(w):
    for suf in ('ies','es','s','ing','ed','ly'):
        if len(w)>5 and w.endswith(suf): return w[:-len(suf)]
    return w
def toks(t): return [stem(w) for w in norm(t).split() if (len(w)>2 or w.isdigit()) and w not in STOP and w not in CMD]
def sent_split(t):
    t=re.sub(r'\[\[(img|pic):[^\]]*\]\]','',t).replace('**','').replace('==','')
    out=[]
    for l in t.split('\n'):
        l=re.sub(r'^[-> #]+','',l).strip()
        if l.startswith('|'):
            cells=[c.strip() for c in l.strip('|').split('|')]
            if all(re.fullmatch(r'-+',c) for c in cells): continue
            l='. '.join(cells)+'.' if False else ' - '.join(cells)
            out.append(l); continue
        out+= [x.strip() for x in re.split(r'(?<=[.!?])\s+',l) if len(x.strip())>25]
    return out
class Notes:
    def __init__(s,text_chunks):
        s.S=[];
        for ci,t in enumerate(text_chunks):
            for x in sent_split(t): s.S.append((ci,x,set(toks(x))))
        df=collections.Counter(w for _,_,ts in s.S for w in ts); n=max(1,len(s.S))
        s.idf=lambda w: math.log(1+n/(1+df.get(w,0)))
    def cov(s,qt,ts):
        tot=sum(s.idf(w) for w in qt)
        return sum(s.idf(w) for w in qt if w in ts)/tot if tot else 0
    def key_mcq(s,q,opts):
        st=set(toks(q)); scores=[]
        for o in opts:
            ot=set(toks(o)); 
            if not ot: scores.append(0); continue
            best=0
            for _,x,ts in s.S:
                a=s.cov(st,ts) if st else 0.5; b=s.cov(ot,ts)
                best=max(best,(0.35+a)*b)
            scores.append(best)
        order=sorted(range(len(opts)),key=lambda i:-scores[i])
        top,sec=scores[order[0]],scores[order[1]]
        if top>=0.5 and top>=1.6*sec+0.02: return order[0],top
        return None,top
    def answer_st(s,q):
        qt=set(toks(q))
        if len(qt)<2 or re.search(r'\b(calculate|draw|design|prepare|measure|plan a|observe|collect|make a|build|create|visit|interview|conduct|record|construct|model|poster|role.?play)\b',q,re.I) or re.search(r'\d+\s*(cm|g|kg|m|°|%|km)',q): return None
        sc=sorted(((s.cov(qt,ts)+0.01*len(ts&qt)),i) for i,(c,x,ts) in enumerate(s.S))[::-1]
        if not sc or sc[0][0]<0.5: return None
        pick=[sc[0][1]]; 
        want=re.search(r'\b(two|three|four|five|six|2|3|4|5|6)\b',q,re.I)
        n={'two':2,'three':3,'four':4,'five':5,'six':6}.get(want.group(1).lower(),int(want.group(1)) if want and want.group(1).isdigit() else 0) if want else 0
        # neighbours in same chunk with decent score
        for sco,i in sc[1:4]:
            if sco>=0.6*sc[0][0] and s.S[i][0]==s.S[pick[0]][0] and len(pick)<(3 if n>=3 or re.search(r'explain|describe|discuss|why',q,re.I) else 2): pick.append(i)
        pick.sort()
        sents=[s.S[i][1] for i in pick]
        ans=' '.join(x if re.search(r'[.!?]$',x) else x+'.' for x in sents)
        if len(ans)>700: ans=ans[:700].rsplit(' ',1)[0]+'…'
        ideas=[]
        for x in sents:
            for cl in re.split(r'[;:]|, | - | and (?=[a-z]+ (?:is|are|can|help|give|make))',x):
                cl=cl.strip(' .'); ws=[w for w in toks(cl) if w not in qt]
                if len(cl.split())>=3 and ws:
                    keys=sorted(set(ws),key=lambda w:-s.idf(w))[:3]
                    ideas.append({'t':cl[:120],'k':keys})
        ideas=ideas[:5]
        if not ideas: return None
        marks=n if n else (3 if re.search(r'explain|describe|discuss|why|compare',q,re.I) else 2)
        marks=max(1,min(5,marks))
        return marks,ans,ideas
