"""Turns a Basic 8 'Reading Notes and Practice Book' (lessons with practice sets) into raw8/<topic>.json (same shape the chapter importer makes).
Usage: python3 parse_lessonbook.py <docx> <strand digit>"""
import docx,re,json,sys,io,hashlib,base64,os
from docx.oxml.ns import qn
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__))
EM=['🌟','🔬','🧪','🌍','⚡','🧲','🌱','🔭','🧬','💡','🪐','🌿']
def txt(el): return ''.join(x.text or '' for x in el.iter(qn('w:t'))).strip()
def sty(el):
    p=el.find(qn('w:pPr'))
    if p is not None and p.find(qn('w:pStyle')) is not None: return p.find(qn('w:pStyle')).get(qn('w:val'))
    return ''
def table_md(tb,d):
    rows=[]
    for tr in tb.iter(qn('w:tr')):
        cells=[' '.join(txt(p) for p in tc.iter(qn('w:p')) if txt(p)).replace('|','/') for tc in tr.iter(qn('w:tc'))]
        rows.append(cells)
    if not rows: return ''
    w=max(len(r) for r in rows); rows=[r+['']*(w-len(r)) for r in rows]
    out=['| '+' | '.join('**%s**'%c if c else '' for c in rows[0])+' |','|'+'---|'*w]
    for r in rows[1:]: out.append('| '+' | '.join(('**%s**'%c if (i==0 and c) else c) for i,c in enumerate(r))+' |')
    return '\n'.join(out)
def image_of(el,d,imgs):
    for b in el.iter(qn('a:blip')):
        rid=b.get(qn('r:embed')); 
        try: blob=d.part.related_parts[rid].blob
        except Exception: return None
        h='i'+hashlib.md5(blob).hexdigest()[:9]
        if not any(i['id']==h for i in imgs):
            im=Image.open(io.BytesIO(blob)).convert('RGB'); im.thumbnail((900,900))
            for q in (82,70,58,45):
                bio=io.BytesIO(); im.save(bio,'JPEG',quality=q,optimize=True); data='data:image/jpeg;base64,'+base64.b64encode(bio.getvalue()).decode()
                if len(data)<=420000: break
            imgs.append({'id':h,'d':data})
        return h
    return None
def parse(path,strand):
    d=docx.Document(path); imgs=[]; lessons=[]; cur=None; mode=None; sec=None
    els=list(d.element.body.iterchildren())
    i=0
    while i<len(els):
        el=els[i]; tag=el.tag.split('}')[1]
        if tag=='p':
            t=txt(el); s=sty(el)
            m=re.fullmatch(r'LESSON (\d+)',t)
            if m:
                nxt=txt(els[i+1]); code=txt(els[i+2])
                cm=re.match(r'B8\.(\d)\.(\d)\.',code)
                cur=dict(n=int(m.group(1)),title=nxt,code=code,sub=cm.group(2) if cm else '?',obj=[],secs=[],going=[],mcq=[],fig=None)
                lessons.append(cur); mode='head'; sec=None; i+=3; continue
            if cur is None: i+=1; continue
            if re.match(r'^\d+\.1\s+Learning Objectives',t): mode='obj'; i+=1; continue
            if re.match(r'^\d+\.2\s+Reading Notes',t): mode='notes'; i+=1; continue
            if re.match(r'^\d+\.3\s+Practical Illustration',t): mode='fig'; i+=1; continue
            if t.startswith('Additional Grade Appropriate Notes'): mode='going'; i+=1; continue
            if t.startswith('Assessment for Lesson'): mode='assess'; i+=1; continue
            if mode=='obj' and t: cur['obj'].append(t)
            elif mode in('notes','fig') and re.match(r'^\d+\.\d+\.\d+\s+Check Your Understanding',t): mode='skip'
            elif mode in('notes','fig','skip') and re.match(r'^\d+\.\d+\.\d+\s+\S',t):
                mode='notes'; sec=dict(title=re.sub(r'^\d+\.\d+\.\d+\s+','',t),parts=[]); cur['secs'].append(sec)
            elif mode=='notes' and sec is not None and t:
                sec['parts'].append(('- '+t) if s=='ListParagraph' else t)
                if el.findall('.//'+qn('w:drawing')) : pass
            elif mode=='fig':
                h=image_of(el,d,imgs)
                if h: cur['fig']={'id':h,'cap':'','note':''}
                elif t.startswith('Fig') and cur['fig']: cur['fig']['cap']=t
                elif t and cur['fig'] is not None: cur['fig']['note']=t
            elif mode=='going' and t: cur['going'].append(t)
            elif mode=='assess':
                m=re.match(r'^(\d+)\.\s+(.*)$',t)
                if m and not re.search(r'Answer\s+_+',t) and not t[0].isalpha()==False:
                    if mcq_open(cur) is not None: pass
                mc=re.match(r'^([A-D])\.\s+(.*)$',t)
                if re.match(r'^[B-F]\. [A-Z]',t) and ('Questions' in t or 'Question' in t) and not t.startswith('A.'): mode='post'
                elif mc and cur['mcq']: cur['mcq'][-1]['o'].append(mc.group(2))
                elif m and 'Answer' not in t and cur.get('inA',True): cur['mcq'].append({'q':m.group(2),'o':[]})
            elif mode=='post': pass
            if re.match(r'^A\. Multiple Choice',t): cur['inA']=True
        elif tag=='tbl' and cur is not None and mode=='notes' and sec is not None:
            sec['parts'].append(table_md(el,d))
        elif tag=='tbl' and cur is not None and mode=='fig':
            pass
        if tag=='p' and cur is not None and mode in('notes',) and sec is not None:
            h=image_of(el,d,imgs)
            if h: sec['parts'].append('[[img:%s|]]'%h)
        i+=1
    return lessons,imgs
def mcq_open(cur): return cur['mcq'][-1] if cur['mcq'] else None
def build(path,strand,topics):
    lessons,imgs=parse(path,strand); out={}; k=0
    for L in lessons:
        code=strand+'.'+L['sub']; top=topics.get(code,code); tid=code
        T=out.setdefault(tid,dict(topic=code+' '+top,level='b8',lessons=[],images=[],skippedPics=0,skippedQs={'tf':0,'syn':0,'mcqNoKey':0}))
        pages=[]
        if L['obj']: pages.append({'title':'What you will learn','body':'🎯 **By the end of this lesson you will be able to:**\n'+'\n'.join('- '+x for x in L['obj'])})
        for s in L['secs']: pages.append({'title':s['title'],'body':'\n\n'.join(p for p in s['parts'] if p)})
        if L['fig']:
            f=L['fig']; pages.append({'title':'Look at the picture','body':'[[img:%s|%s]]\n\n%s'%(f['id'],f['cap'].replace(']',')'),f['note'])})
        if L['going']: pages.append({'title':'Going further','body':'> 💡 **Going further**\n\n'+'\n\n'.join(L['going'])})
        pages=[p for p in pages if p['body'].strip()]
        groups=[pages[j:j+2] for j in range(0,len(pages),2)]
        if len(groups)>1 and len(groups[-1])==1 and len(groups[-2])==2: groups[-2:]=[groups[-2]+groups[-1]]
        base=len(T['lessons'])
        for gi,g in enumerate(groups):
            title=L['title'] if gi==0 else (g[0]['title'] if g[0]['title'] not in('What you will learn',) else L['title'])
            if gi>0 and g[0]['title'] in('Look at the picture','Going further'): title=L['title']+(' (part %d)'%(gi+1))
            lesson=dict(subject='sci',level='b8',topic=T['topic'],kind='learn',title=title[:100],emoji=EM[(base+gi)%len(EM)],order=len(T['lessons'])+1,status='draft',pages=g,questions=[],source=os.path.basename(path),segId=L['n'])
            T['lessons'].append(lesson)
        # practice MCQs go to the last mini-lesson of this lesson (build step places each in its best mini-lesson)
        qs=[]
        for q in L['mcq']:
            if len(q['o'])==4: qs.append({'t':'mcq','q':q['q'],'o':q['o'],'c':0,'e':'','nokey':True})
        T['lessons'][-1]['questions'].extend(qs)
        for im in imgs:
            if any(('[[img:%s'%im['id']) in p['body'] for l in T['lessons'] for p in l['pages']) and im not in T['images']: T['images'].append(im)
    return out
if __name__=='__main__':
    path,strand=sys.argv[1],sys.argv[2]
    TOP={'4':{'1':'Energy','2':'Electricity and Electronics','3':'Conversion and Conservation of Energy','4':'Force and Motion','5':'Agricultural Tools'},
         '5':{'1':'Waste Management','2':'Human Health','3':'Science and Industry','4':'Climate Change and Green Economy','5':'Soils','6':'Rocks and the Origin of Soils'}}[strand]
    res=build(path,strand,{strand+'.'+k:v for k,v in TOP.items()})
    os.makedirs(os.path.join(HERE,'raw8'),exist_ok=True)
    for tid,T in res.items():
        json.dump(T,open(os.path.join(HERE,'raw8',tid+'.json'),'w'))
        print(tid,T['topic'],'minis',len(T['lessons']),'mcq',sum(len(l['questions']) for l in T['lessons']),'images',len(T['images']))
