"""Builds the importable file for Basic 7 Science, Strand 1 (1.1 Materials + 1.2 Living Cells).
Inputs : /tmp/e2e/book11.json, /tmp/e2e/book12.json (in-app importer output), /tmp/s1parts.json (Strand 1 practice book:
         [reading notes, multiple-choice block] per lesson), answer key below (worked out from the reading notes).
Output : argv[1]  -> {lessons, images}
Every key idea / keyword / answer below was written from the chapter text or the practice book's own notes."""
import json,re,sys,html
I=lambda t,*k:{'t':t,'k':list(k)}
src=open('/home/claude/work/cf/kids/tools/make_pilot.py').read()
A={}
exec(src[src.index("A={}")+4:src.index("L=r['lessons']")],{'I':I,'A':A})   # ideas for the 12 Materials 1.1 test questions

# ---------------- 1.2 Living Cells: key ideas ----------------
PARTS=[I('Cell membrane','membrane'),I('Cytoplasm','cytoplasm'),I('Nucleus','nucleus'),I('Ribosome','ribosome','ribosomes'),I('Endoplasmic reticulum','endoplasmic','reticulum'),I('Golgi apparatus','golgi'),I('Mitochondria','mitochondri'),I('Lysosome','lysosome','lysosomes'),I('Vacuole','vacuole','vacuoles')]
PLANT3=[I('Cell wall','wall'),I('Chloroplasts','chloroplast','chloroplasts'),I('Large vacuole','vacuole','central')]
BOTH=[I('Cell membrane','membrane'),I('Cytoplasm','cytoplasm'),I('Nucleus','nucleus'),I('Mitochondria','mitochondri'),I('Ribosomes','ribosome','ribosomes'),I('Endoplasmic reticulum','endoplasmic','reticulum'),I('Golgi apparatus','golgi'),I('Vacuole','vacuole')]
def st(q,m,ans,ideas): return {'t':'st','q':q,'parts':[{'q':'Write your answer.','m':m,'a':ans,'ideas':ideas}]}
C={}  # question text (start) -> (marks, model answer, ideas)
C['Name four parts found inside an animal cell']=(4,"Nucleus: controls the cell. Cell membrane: controls what enters and leaves. Mitochondrion: releases energy. Ribosome: makes proteins.",
  [I('Nucleus, the control centre','nucleus','control'),I('Cell membrane, controls what enters and leaves','membrane','enters','leaves'),I('Mitochondria, release energy','mitochondri','energy'),I('Ribosome, makes proteins','ribosome','protein','proteins'),I('Cytoplasm, fluid where activities happen','cytoplasm','fluid'),I('Endoplasmic reticulum, moves substances','endoplasmic','reticulum','tubes'),I('Golgi apparatus, packages materials','golgi','package','packages'),I('Lysosome, breaks down waste','lysosome','waste'),I('Vacuole, stores water and waste','vacuole','store','stores')])
C['Name three parts found only in a plant cell']=(3,"A cell wall, chloroplasts and one large vacuole.",PLANT3)
C['Name three parts found in a plant cell but not in an animal cell']=(3,"A cell wall, chloroplasts and one large vacuole.",PLANT3)
C['What is the job of a ribosome']=(1,"A ribosome makes proteins for the cell.",[I('Makes proteins','protein','proteins')])
C['Explain why a plant cell needs a cell wall']=(3,"A plant must stay firm in one place and stand upright. The cell wall is a strong, stiff layer that gives the cell a fixed shape and keeps the plant firm. An animal cell has no cell wall, so its shape can change.",
  [I('The cell wall gives a fixed shape','shape','fixed','box'),I('It keeps the plant firm, strong and standing','firm','strong','stiff','support','stand','upright'),I('An animal cell has no cell wall, so its shape changes','animal','no wall','round','irregular','changing','not have','does not')])
C['A scientist looks at a cell']=(2,"It is most likely an animal cell, because it has no cell wall, so its shape is round and can change.",
  [I('An animal cell','animal'),I('It has no cell wall, so the shape is round or changing','wall','round','irregular','changing')])
C['A leaf cell is making a large amount of protein']=(4,"The ribosomes make the proteins. The endoplasmic reticulum moves the proteins around inside the cell, and the Golgi apparatus packages them and ships them to where they are needed.",
  [I('Ribosome','ribosome','ribosomes'),I('The ribosome makes proteins','make protein','makes protein','proteins','protein'),I('Endoplasmic reticulum or Golgi apparatus','reticulum','golgi','endoplasmic'),I('It moves or packages the proteins','moves','move','package','packages','packaging','ships','tubes')])
C["If a cell's mitochondria stopped working"]=(2,"The cell would not get the energy it needs to work, so it could not carry out its activities and might die.",
  [I('Mitochondria release the energy the cell needs','energy'),I('So the cell cannot work properly','cannot','stop','stops','die','work','activities','weak','no energy')])
C['Think about everything you have learned']=None   # multi-part, handled below
C['Name five parts found inside an animal cell']=(5,"For example: cell membrane, cytoplasm, nucleus, ribosome, mitochondrion (also endoplasmic reticulum, Golgi apparatus, lysosome, vacuole).",PARTS)
C['Which part of the cell controls everything']=(1,"The nucleus.",[I('Nucleus','nucleus')])
C['Which two parts work together to make and package proteins']=(2,"The ribosome makes the proteins and the Golgi apparatus (with the endoplasmic reticulum) packages and moves them.",
  [I('Ribosome','ribosome','ribosomes'),I('Golgi apparatus or endoplasmic reticulum','golgi','reticulum','endoplasmic')])
C['Why do you think a cell needs a membrane']=(2,"The cell membrane is a thin skin around the cell. It controls what enters and leaves the cell.",
  [I('It controls what enters and leaves the cell','controls','enter','enters','leave','leaves','let','allow'),I('It is like a skin that keeps the cell together and protects it','skin','protect','keeps','inside','holds','boundary','around')])
C['Why does a plant cell need a cell wall']=C['Explain why a plant cell needs a cell wall']
C['What job does a chloroplast do']=(2,"A chloroplast traps sunlight and uses it to make food for the plant.",[I('Traps sunlight','sunlight','light','sun'),I('To make food for the plant','food','photosynthesis')])
C['Name three parts found in both']=(3,"Any three of: cell membrane, cytoplasm, nucleus, mitochondria, ribosomes, endoplasmic reticulum, Golgi apparatus, vacuole.",BOTH)
C['A friend shows you a cell under a microscope']=(2,"It is more likely a plant cell, because a fixed, box-like shape comes from a cell wall and a very large vacuole is typical of a plant cell.",
  [I('A plant cell','plant'),I('Gives a reason such as a cell wall or large vacuole','wall','vacuole','fixed','firm','box')])
C['Explain why an animal cell does not need a chloroplast']=(2,"A chloroplast traps sunlight so a plant can make its own food. An animal cannot make its own food from sunlight, so its cells do not need chloroplasts.",
  [I('A chloroplast traps sunlight to make food','sunlight','food','photosynthesis','trap','traps'),I('An animal does not make its own food','eat','eats','eating','not make','cannot make','get food','another','other')])
def cell_multi(q):
    ms=[(3,"Any three of: cell membrane, cytoplasm, nucleus, mitochondria, ribosomes, endoplasmic reticulum, Golgi apparatus, vacuole.",BOTH),
        (3,"A cell wall, chloroplasts and one large vacuole.",PLANT3),
        (3,"Chloroplast: it traps sunlight so the plant can make its own food. An animal does not make its own food, so it does not need chloroplasts. (Or the cell wall: it gives a fixed shape and keeps the plant firm; animals do not need to stay firm in one place.)",
          [I('Names a plant-only part','wall','chloroplast','vacuole'),I('Says what it does','firm','shape','support','sunlight','food','trap','store','water','sap'),I('Says why an animal cell does not need it','animal','not need','does not','eat','move','not make','no need')]),
        (3,"A plant cell has a cell wall, which is a stiff layer outside the membrane that gives the cell a fixed, box-like shape. An animal cell has no cell wall, so its shape is round or irregular and can change.",
          [I('A plant cell has a cell wall','wall'),I('The wall is stiff, so the shape is fixed and box-like','stiff','fixed','firm','box'),I('An animal cell has no wall, so its shape is round or can change','no wall','not have','round','irregular','changing','soft','flexible')])]
    for p,(m,a,ids) in zip(q['parts'],ms): p['m']=m;p['a']=a;p['ideas']=ids

def fill(q,table):
    for key,v in table.items():
        if v and q['q'].startswith(key):
            m,a,ids=v; q['parts']=[{'q':'Write your answer.','m':m,'a':a,'ideas':ids}]; return True
    return False

# ---------------- multiple-choice answer key (worked out from the practice book's reading notes) ----------------
KEY={1:"AABBBCDBBC",2:"DACCBCAACD",3:"DDAACCADAC",4:"DBCDBBBCBD",5:"DAACBDCACB",6:"ABBACDBCAB"}
parts=json.load(open('/tmp/s1parts.json'))
def un(s): return html.unescape(s).strip()
def mcqs(lesson):
    notes,block=parts[lesson-1]; out=[]
    for m in re.finditer(r'\n(\d{1,2})\. (.*?)\nA\. (.*?)\nB\. (.*?)\nC\. (.*?)\nD\. (.*?)(?=\n\n|\Z)',block+'\n\n',re.S):
        n=int(m.group(1)); o=[un(m.group(i)) for i in range(3,7)]; c='ABCD'.index(KEY[lesson][n-1])
        out.append({'t':'mcq','q':un(m.group(2)).replace('\n',' '),'o':o,'c':c,'e':'','_l':lesson})
    return out
STOP=set("the a an of to and in is are as for it its by on at with that this from or be can has have not only mainly best most which what when how their they them also into than then used use one two three your you".split())
def stem(w): w=w.lower(); w=re.sub(r"[^a-z0-9]","",w); return re.sub(r'(ies|es|s|ing|ed|ly)$','',w) if len(w)>4 else w
def words(t): return {stem(w) for w in re.findall(r"[A-Za-z0-9']+",t) if w.lower() not in STOP and len(w)>2}
def sentences(t):
    lines=[l.strip() for l in html.unescape(t).split('\n') if len(l.strip())>70 and not l.strip().startswith(('IMAGE','Notice how','A labelled','A simplified','A three panel','A four panel','A central'))]
    return [x.strip() for l in lines for x in re.split(r'(?<=[.!?])\s+',l) if len(x.strip())>25]

MAP={'11':{1:[(1,[1,2,3,4,5,6,10])],2:[(1,[7,8,9])],3:[(2,[1,3,4,5,7])],4:[(2,[2,6,8,9,10])],5:[(3,list(range(1,11)))],6:[(4,[1,8,9,10])],7:[(4,[2,3,4,5,6,7])]},
     '12':{0:[(5,[8,10])],1:[(5,[1,2,3,4,5,6,7])],2:[(6,[9,10])],3:[(6,[1,2,3,4,8])],5:[(6,[5,6,7]),(5,[9])]}}
def build(book,topic_key,supp_lessons,tests_table,tries_table):
    r=json.load(open(book)); L=r['lessons']; T=L[-1]
    learn=[l for l in L if l['kind']=='learn' and l['title'] not in ('Quick recap','Word bank')]
    for l in L:
        for q in l['questions']: pass
    # structured questions from the chapter's own revision
    for q in T['questions']:
        if q['q'].startswith('Think about everything'): cell_multi(q)
        elif topic_key=='11':
            pass
        else: fill(q,tests_table)
    for l in learn:
        for q in l['questions']:
            if not fill(q,tries_table): print('NO KEY FOR TRY',q['q'])
    # multiple choice -> the mini-lesson it belongs to (mapping decided by topic; evidence sentence shown after answering)
    bank=[]; report=[]
    for li,spec in MAP[topic_key].items():
        for sl,nums in spec:
            notes=parts[sl-1][0]; sents=sentences(notes[notes.find('Reading Notes'):])
            qs=mcqs(sl)
            for n in nums:
                q=qs[n-1]; qa=words(q['q'])|words(q['o'][q['c']])
                ev=max(sents,key=lambda x:len(words(x)&qa)) if sents else ''
                q['e']=(ev[:230]+('…' if len(ev)>230 else '')) if ev else ''
                L[li]['questions'].append(q); report.append((sl,n,L[li]['title'][:30]))
    return r,L,T,bank,report

def finish(r,L,T,bank,prefix,topic,source):
    out=[]
    for n,l in enumerate(L):
        l['status']='published'; l['id']='%s-%02d'%(prefix,n+1)
        for q in l['questions']: q.pop('_l',None)
        out.append(l)
    if bank:
        for q in bank: q.pop('_l',None)
        out.append({'subject':'sci','level':'b7','topic':topic,'kind':'bank','title':'Question bank: '+topic,'emoji':'🎯','order':901,'status':'published','pages':[],'questions':bank,'source':source,'id':prefix+'-bank'})
    return out

if __name__=='__main__':
    # ---- 1.1 Materials
    r,L,T,bank,rep=build('/tmp/e2e/book11.json','11',[],{},{})
    for i,q in enumerate(T['questions']):
        if i<11: m,a,ids=A[i]; p=q['parts'][0]; p['m']=m;p['a']=a;p['ideas']=ids;p['q']='Write your answer.'
        else:
            for k,key in enumerate('abcd'):
                m,a,ids=A['11'+key]; p=q['parts'][k]; p['m']=m;p['a']=a;p['ideas']=ids
    # give the structured chapter questions a home in the mini-lesson they belong to (they also stay in the topic test)
    home={0:1,1:2,2:2,3:4,4:7,5:6,6:4,7:2,8:7,9:1,10:5}     # question index -> index in L (learn lessons)
    import copy
    for qi,li in home.items(): L[li]['questions'].append(copy.deepcopy(T['questions'][qi]))
    all11=finish(r,L,T,bank,'b7-s1-1-1','1.1 Materials','B7_1.1_Materials.docx + Strand 1 practice book')
    rows=rep
    # ---- 1.2 Living Cells
    r2,L2,T2,bank2,rep2=build('/tmp/e2e/book12.json','12',[],C,C)
    names=['Animal Cells','Animal Cells: the parts','Plant Cells','Plant Cells: the parts','Comparing animal and plant cells','What they share, how they differ']
    k=0
    for l in L2:
        if l['kind']=='learn' and l['title'] not in ('Quick recap','Word bank'):
            l['title']=names[k]; k+=1
    # the chapter's own structured test questions also feed the mini-lessons
    home2={0:1,1:3,2:1,3:3,4:5,5:1,6:1}
    for qi,li in home2.items(): L2[li]['questions'].append(copy.deepcopy(T2['questions'][qi]))
    all12=finish(r2,L2,T2,bank2,'b7-s1-1-2','1.2 Living Cells','B7_1.2_Living_Cells.docx + Strand 1 practice book')
    for l in all11: l['order']=l['order']
    imgs=r['images']+r2['images']
    json.dump({'lessons':all11+all12,'images':imgs},open(sys.argv[1],'w'))
    print('\n'.join(map(str,rows+rep2)))
    for l in all11+all12:
        mc=sum(q['t']=='mcq' for q in l['questions']); s=sum(q['t']=='st' for q in l['questions'])
        print(l['id'].ljust(18),l['kind'].ljust(5),l['title'][:40].ljust(40),'cards',len(l['pages']),'mcq',mc,'st',s)
