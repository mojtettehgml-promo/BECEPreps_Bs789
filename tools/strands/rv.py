import json,sys
for b in sys.argv[1:]:
    r=json.load(open('raw8/%s.json'%b)); n=0; print('#####',b)
    for l in r['lessons']:
        for q in l['questions']:
            if q['t']=='mcq' and q.get('nokey'):
                n+=1; print('%d. %s | %s'%(n,q['q'][:120],' / '.join('%s %s'%('ABCD'[i],o[:60]) for i,o in enumerate(q['o']))))
