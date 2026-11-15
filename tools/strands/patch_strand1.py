"""Adds the new Strand 1 sections from the fixed notes (1.1 changes of state, 1.2 cells to organisms) to data/strand1.json.
Run once from this folder. Every answer below is written from the fixed reading notes."""
import json,copy,os,re
from common import S
HERE=os.path.dirname(os.path.abspath(__file__)); P=os.path.join(HERE,'data','strand1.json')
d=json.load(open(P)); E='/tmp/e2e/books/'
def mk(q,marks,model,ideas):
    a=S('x',marks,model,ideas)['parts'][0]
    return {'t':'st','q':q,'parts':[{'q':'Write your answer.','m':a[0],'a':a[1],'ideas':a[2]}]}
def norm(t): return re.sub(r'[^a-z0-9 ]+','',t.lower())
ids={l['id'] for l in d['lessons']}
if 'b7-s1-1-1-12' in ids: raise SystemExit('already patched')
# ---- 1.1
b=json.load(open(E+'1.1.json')); nl=copy.deepcopy(b['lessons'][3]); nl.pop('segId',None)
nl.update(id='b7-s1-1-1-12',title='The three states of matter: changes of state',order=2,status='published',emoji='🔥')
Q11=[mk('Name the change of state that takes place when ice becomes water',2,"Ice becoming water is melting, and water vapour becoming water is condensation.","Melting::melting,melts,melt|Condensation::condensation,condenses,condense"),
 mk('State the difference between boiling and evaporation',2,"Boiling changes a liquid to a gas throughout the liquid at a fixed temperature (100 degrees Celsius for water). Evaporation changes a liquid to a gas at its surface at any temperature.","Boiling: throughout the liquid at a fixed temperature::throughout,whole,fixed temperature,100|Evaporation: at the surface at any temperature::surface,any temperature,all temperatures"),
 mk('What is sublimation',2,"Sublimation is when a solid changes directly to a gas without becoming a liquid. For example, naphthalene balls slowly become smaller.","A solid changes directly to a gas::solid,gas,directly,without becoming a liquid,without liquid|An example such as naphthalene balls::naphthalene,mothball,mothballs"),
 mk('Drops of water form on the outside of a bottle',3,"The change of state is condensation. Water vapour in the air touches the cold bottle, cools and changes to liquid water, so the water comes from the air.","Condensation::condensation,condenses,condense|The water vapour in the air::vapour,vapor,air|Cools or touches the cold bottle::cold,cools,cooled,cool")]
nl['questions']=copy.deepcopy(Q11)
L=d['lessons']; L.insert(next(i for i,l in enumerate(L) if l['id']=='b7-s1-1-1-11'),nl)
t=next(l for l in L if l['id']=='b7-s1-1-1-11'); t['questions']+=copy.deepcopy(Q11)
# ---- 1.2
b=json.load(open(E+'1.2.json')); nl=copy.deepcopy(b['lessons'][6]); nl.pop('segId',None)
nl.update(id='b7-s1-1-2-10',title='From cells to organisms',order=7,status='published')
Q12=[mk('Arrange these in order from the smallest to the largest',2,"Cell, tissue, organ, organ system, organism.","Cell is the smallest::cell|Then tissue, organ, organ system::tissue,organ,organ system|Organism is the largest::organism"),
 mk('What is a tissue',2,"A tissue is a group of similar cells that work together to do one job. For example, muscle tissue is made of muscle cells.","A group of similar cells::similar cells,same kind,group of cells,cells of the same kind|Doing one job together::one job,together,same job|An example such as muscle tissue::muscle,muscle tissue"),
 mk('State the difference between a unicellular organism',3,"A unicellular organism is made of only one cell, for example amoeba or bacteria. A multicellular organism is made of many cells, for example humans, goats or mango trees.","Unicellular: only one cell::one cell,single cell,only one|Multicellular: many cells::many cells,more than one|Gives an example of each::amoeba,bacteria,human,humans,goat,goats,mango")  ,
 mk('A cut on your finger heals after some days',3,"New cells are made when existing cells divide. The new cells replace the damaged ones, so the cut heals and the body repairs itself.","Existing cells divide::divide,divides,division|New cells replace damaged ones::new cells,replace,repair,repairs,heal,heals")]
nl['questions']=copy.deepcopy(Q12)
i=next(i for i,l in enumerate(L) if l['id']=='b7-s1-1-2-09'); L.insert(i,nl)
t=L[i+1]; t['questions']+=copy.deepcopy(Q12)
json.dump(d,open(P,'w'),separators=(',',':'),ensure_ascii=False)
print('patched',len(L),'lessons')
