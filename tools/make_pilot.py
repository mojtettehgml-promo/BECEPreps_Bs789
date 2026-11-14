"""Builds the importable lesson file for Basic 7 Integrated Science 1.1 Materials.
Input: /tmp/e2e/book.json (output of the in-app importer). Output: pilot JSON.
Key ideas and key words below were written from the chapter text (Materials 1.1)."""
import json,sys
r=json.load(open('/tmp/e2e/book.json'))
I=lambda t,*k:{'t':t,'k':list(k)}
A={}
A[0]=(3,"A solid has a fixed shape and a fixed volume. A gas has no fixed shape and no fixed volume, so it fills all the space in its container. The particles of a solid are packed close together and only vibrate, but the particles of a gas are far apart and move fast in every direction. A gas can be squeezed easily, a solid cannot.",
 [I('A solid has a fixed shape, a gas does not','shape'),I('A solid has a fixed volume, a gas fills its container','volume','fills','fill','container','space'),I('Particles in a solid are packed close, in a gas they are far apart','packed','close','apart','spread'),I('Particles in a solid only vibrate, in a gas they move fast and freely','vibrate','shake','freely','randomly','fast'),I('A gas can be squeezed (compressed), a solid cannot','compress','compressed','squeeze','squeezed')])
A[1]=(3,"Solids: wood (for building and furniture) and stone (for foundations and roads). Liquids: water (for drinking and cooking) and palm oil (for preparing food).",
 [I('Gives examples of solids','wood','stone','rock','iron','metal','clay','salt','laterite','nail','ice','chalk'),I('Gives examples of liquids','water','oil','palm oil','petrol','kerosene','diesel','blood','cooking oil','palm wine'),I('States a use','building','furniture','roads','tools','drinking','cooking','fuel','washing','pottery','bricks','food','soap')])
A[2]=(3,"Heat or pressure can change a material from one state to another. For example, butter is a solid but it melts and becomes a liquid when it is heated. Cooking gas is stored as a liquid under pressure and turns into a gas when it is released.",
 [I('Heat or pressure causes the change','heat','heated','hot','pressure','warm'),I('Gives an example such as butter, ice or cooking gas','butter','melt','melts','melted','ice','cooking gas','cylinder','steam','water'),I('Says which state it changes from and to','solid','liquid','gas','turns into','becomes')])
A[3]=(2,"Clean water is limited, so we must use it with care. Our bodies need water to digest food, control temperature and remove waste, and we also use water for cooking, washing and watering farms. If it is wasted or polluted there may not be enough for everyone.",
 [I('Clean water is limited and can run out','limited','scarce','run out','not enough','dry','shortage'),I('We need water to live and stay healthy','body','drink','drinking','life','survive','health','digest','alive'),I('Water is used for cooking, washing and farming','cook','cooking','wash','washing','farm','farming','agriculture','electricity'),I('Water can be wasted or polluted','pollut','polluted','waste','wasted','dirty')])
A[4]=(4,"Sodium is Na. Oxygen is O. Carbon is C. Potassium is K.",
 [I('Sodium is Na','na'),I('Oxygen is O','o'),I('Carbon is C','c'),I('Potassium is K','k')])
A[5]=(3,"The three families are metals, nonmetals and noble gases. Metals are shiny and good at carrying heat and electricity. Nonmetals look dull and carry heat and electricity poorly. Noble gases are colourless gases that almost never react with other elements.",
 [I('Metals, with a property such as shiny or good conductors','metals','metal','shiny','conduct','conductors','hammered','wire'),I('Nonmetals, with a property such as dull or brittle','nonmetals','nonmetal','non-metal','non metal','dull','brittle','poor'),I('Noble gases, with a property such as not reacting','noble','colourless','react','unreactive','helium','neon','argon')])
A[6]=(2,"She should store the palm oil in a clean container and cover it tightly so it does not spill or get dirty. She can also label the container clearly.",
 [I('Use a clean container','clean','container','bottle','gallon','jerrycan','keg'),I('Cover it with a tight lid so it does not spill','cover','covered','lid','tight','closed','cap'),I('Label the container','label','labelled','labeled')])
A[7]=(2,"The ice cube melted. It changed from a solid to a liquid (water). The heat from the sun caused the change.",
 [I('The ice cube melted into water (solid to liquid)','melt','melted','melts','liquid','water','turned','changed'),I('Heat from the sun caused it','heat','hot','sun','warm','energy')])
A[8]=(4,"Sodium is a metal because it is shiny and carries heat and electricity well. Chlorine is a nonmetal. Neon is a noble gas because it almost never reacts with other elements.",
 [I('Sodium is a metal','metal'),I('Chlorine is a nonmetal','nonmetal','non-metal','non metal'),I('Neon is a noble gas','noble'),I('Gives a reason such as shiny, conducts, dull or does not react','because','shiny','conduct','dull','react','reacts','brittle','colourless')])
A[9]=(2,"Cooking gas has no fixed shape and no fixed volume, so it would spread out and escape from an open plastic bag. It is stored as a liquid under pressure, so it needs a strong metal cylinder with a tight cover.",
 [I('A gas spreads out and would escape from an open bag','escape','spread','spreads','leak','fill','fills','no fixed','out'),I('The cylinder is strong and tight to hold the gas under pressure','strong','pressure','tight','cylinder','sealed','closed','cover')])
A[10]=(2,"He could use stone (or iron, or bricks made from clay). Solids have a fixed shape and volume and are strong, so the tank will keep its shape and hold the water.",
 [I('Suggests a solid material','stone','rock','iron','metal','clay','brick','bricks','concrete','cement','laterite'),I('Gives a reason such as strong or keeps its shape','strong','hard','hold','holds','leak','fixed shape','keeps','last','lasts','durable')])
A['11a']=(2,"Liquid resource: water. Solid resource: trees (timber) or minerals.",
 [I('Names a liquid resource','water','oil','fuel','petrol','kerosene','diesel','palm oil','cooking oil'),I('Names a solid resource','wood','timber','trees','tree','stone','mineral','minerals','salt','gold','clay','iron','sand')])
A['11b']=(2,"Water is wasted when taps are left running or when rubbish is thrown into rivers. Trees are cut down without planting new ones, and careless or illegal mining (galamsey) destroys land.",
 [I('Says how the liquid is used or misused','waste','wasted','wasting','tap','taps','leak','pollut','polluted','pour','rubbish','dirty'),I('Says how the solid is used or misused','cut','cutting','mining','galamsey','destroy','destroys','careless','illegal','burn','burning')])
A['11c']=(2,"Rivers and wells may become dirty or dry up, so there may not be enough clean water. Destroyed land and water bodies harm farming and the health of people in the community.",
 [I('Describes a harmful effect','destroy','destroys','shortage','dry','scarce','run out','pollut','polluted','disease','sick','dirty','damage','harm','no more','lose'),I('Says who or what is affected','community','people','farm','farms','health','land','water')])
A['11d']=(2,"Turn off taps and fix leaks. Store water in clean covered containers. Do not pour waste or rubbish into rivers, streams or wells. Collect rain water for watering plants. Plant new trees to replace those cut down and stop illegal mining (galamsey).",
 [I('Turn off taps and fix leaks','tap','taps','leak','leaks'),I('Store water in clean, covered containers','container','containers','cover','covered','clean'),I('Do not pour waste or rubbish into rivers or wells','pour','rubbish','rivers','river','wells','pollut','dispose'),I('Collect rain water','rain'),I('Plant new trees to replace those cut down','plant','trees','tree','replace'),I('Stop illegal mining (galamsey)','galamsey','illegal','mining'),I('Use resources wisely and with care','wisely','carefully','care','save','conserve')])
L=r['lessons'];T=L[-1]
for i,q in enumerate(T['questions']):
    if i<11:
        m,ans,ideas=A[i];p=q['parts'][0];p['m']=m;p['a']=ans;p['ideas']=ideas;p['q']='Write your answer.'
    else:
        for k,key in enumerate('abcd'):
            m,ans,ideas=A['11'+key];p=q['parts'][k];p['m']=m;p['a']=ans;p['ideas']=ideas
for n,l in enumerate(L):
    l['status']='published';l['id']='b7-s1-1-1-%02d'%(n+1);l['kind']=l.get('kind','learn')
json.dump({'lessons':L,'images':r['images']},open(sys.argv[1],'w'))
print('lessons',len(L),'images',len(r['images']),'questions',len(T['questions']))
