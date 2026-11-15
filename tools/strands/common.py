"""Helpers for authoring answers. Every idea/key word is written from the book's own text."""
def _ideas(s):
    out=[]
    for part in s.split('|'):
        part=part.strip()
        if not part: continue
        t,_,k=part.partition('::')
        keys=[x.strip() for x in k.split(',') if x.strip()] or [w for w in t.lower().split() if len(w)>3][:3]
        out.append({'t':t.strip(),'k':keys})
    return out
def S(prefix,marks,model,ideas):
    """one structured question (single part)"""
    return {'kind':'st','prefix':prefix,'parts':[(marks,model,_ideas(ideas))]}
def X(prefix,*parts):
    """multi-part question: parts = (marks, model, ideas) in order"""
    return {'kind':'st','prefix':prefix,'parts':[(m,a,_ideas(i)) for m,a,i in parts]}
