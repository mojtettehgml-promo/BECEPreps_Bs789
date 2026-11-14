import os
here=os.path.dirname(os.path.abspath(__file__))
css=open(here+'/style.css').read();js=''.join(open(here+'/'+f).read()+'\n' for f in ['js1.js','js2.js','js3.js'])
html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>BECE Prep Zone</title>
<meta name="description" content="Fun BECE revision for Integrated Science, Mathematics and Ga."><meta name="theme-color" content="#6d3fe0">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{css}</style></head><body><div id="app"><p style="padding:24px">Loading…</p></div><script>
{js}</script></body></html>'''
open(here+'/../public/index.html','w').write(html)
