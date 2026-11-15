import json,sys,re
sys.path.insert(0,'.')
import auto
def items(book):
    r=json.load(open('raw8/%s.json'%book)); L=r['lessons']
    notes=auto.Notes([p['body'] for l in L if l['kind']=='learn' and l['title'] not in('Quick recap','Word bank') for p in l['pages']])
    out=[]
    for l in L:
        for q in l['questions']:
            if q['t']=='mcq' and q.get('nokey'): out.append(q)
    return notes,out
if __name__=='__main__':
    for book in sys.argv[1:]:
        notes,qs=items(book); print('#####',book,len(qs))
        for n,q in enumerate(qs,1):
            k,sc=notes.key_mcq(q['q'],q['o'])
            st=set(auto.toks(q['q']))
            ev=max(notes.S,key=lambda s:notes.cov(st,s[2])+0.01*len(s[2]&st))[1] if st else ''
            print('%d. %s | %s | auto:%s'%(n,q['q'][:110],' / '.join('%s %s'%('ABCD'[i],o[:48]) for i,o in enumerate(q['o'])),'ABCD'[k] if k is not None else '-'))
            if k is None: print('   >>',ev[:210])
