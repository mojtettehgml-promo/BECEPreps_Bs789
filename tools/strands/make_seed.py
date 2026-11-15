"""Builds ../../src/seed/*.json + index.mjs from raw/ + data/ (run from this folder: python3 make_seed.py)."""
import sys,json,re,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import build_strands as b
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'..','..','src','seed');os.makedirs(OUT,exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT,f))
def imgs_for(lessons,pool):
    ids=set()
    for l in lessons:
        for p in l['pages']: ids|=set(re.findall(r'\[\[img:([A-Za-z0-9]+)',p['body']))
    return [x for x in pool if x['id'] in ids]
parts=[]
s1=json.load(open(os.path.join(HERE,'data','strand1.json')))
for sub,title in (('b7-s1-1-1-','1.1 Materials'),('b7-s1-1-2-','1.2 Living Cells')):
    L=[l for l in s1['lessons'] if l['id'].startswith(sub)]; parts.append((title,L,imgs_for(L,s1['images'])))
assert sum(len(x[1]) for x in parts)==len(s1['lessons'])
for i in "2.1 2.2 2.3 2.4 3.1 3.2 3.3 3.4 4.1 4.2 4.3 4.4 4.5 5.1 5.2 5.3 5.4 5.5".split():
    L,I,s=b.build(i,verbose=False); t=L[0]['topic']; parts.append((t if t.startswith(i) else i+' '+t,L,imgs_for(L,I)))
idx=[]
for n,(t,L,I) in enumerate(parts):
    json.dump({'lessons':L,'images':I},open(os.path.join(OUT,'p%02d.json'%n),'w'),separators=(',',':'),ensure_ascii=False); idx.append({'title':t,'lessons':len(L)})
m=''.join('import p%02d from "./p%02d.json";\n'%(n,n) for n in range(len(parts)))+'export default {\n  index: '+json.dumps(idx,ensure_ascii=False)+',\n  parts: ['+', '.join('p%02d'%n for n in range(len(parts)))+'],\n};\n'
open(os.path.join(OUT,'index.mjs'),'w').write(m)
ids=[l['id'] for _,L,_ in parts for l in L]; print(len(parts),'parts',len(ids),'lessons; duplicate ids:',len(ids)-len(set(ids)))
