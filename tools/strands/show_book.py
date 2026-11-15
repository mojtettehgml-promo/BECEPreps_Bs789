import json,sys,re
r=json.load(open('/home/claude/work/cf/kids/tools/strands/raw/%s.json'%sys.argv[1]))
only=sys.argv[2] if len(sys.argv)>2 else 'all'
def clean(t): return re.sub(r'\[\[img:[^\]]*\]\]','[img]',t).replace('**','').replace('\n\n','\n')
if only in('all','text'):
  for i,L in enumerate(r['lessons']):
    if L['kind']!='learn' or L['title'] in ('Quick recap','Word bank'): continue
    print('\n[%d] %s'%(i,L['title']))
    for p in L['pages']: print((p['title']+': ' if p['title'] else '')+clean(p['body']))
if only in('all','q'):
  print('\n===== QUESTIONS needing answers')
  for i,L in enumerate(r['lessons']):
    for q in L['questions']:
      if q['t']=='st': print('[%d] ST %s'%(i,q['q']+(' || '+' // '.join(p['q'] for p in q['parts']) if len(q['parts'])>1 else '')))
      elif q.get('nokey'): print('[%d] MC# %s | A) %s | B) %s | C) %s | D) %s'%((i,q['q'])+tuple(q['o'][:4])))
