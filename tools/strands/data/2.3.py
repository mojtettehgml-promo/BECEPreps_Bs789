from common import S,X
EX="Farmyard manure::manure,farmyard|Compost::compost|Green manure::green manure|Poultry droppings::poultry,droppings|Urea::urea|Muriate of potash::potash,muriate|Single superphosphate::superphosphate|Ammonium sulphate::ammonium,sulphate|NPK or another compound fertilizer::npk,compound"
METH="Broadcasting::broadcast|Placement (side or band placement)::placement,band,side placement|Ring method::ring,circular|Drilling::drill|Foliar application::foliar,spray,leaves|Fertigation::fertigation,irrigation"
DIFF="Organic sources come from the remains or waste of living things (plants and animals)::living things,plants,animals,waste,remains,manure,compost|Inorganic sources are manufactured chemical fertilizers::manufactured,chemical,factory,fertilizer,fertiliser,compounds"
QA=[
S("Name three organic nutrient sources and three inorganic",6,"Organic: farmyard manure, compost, green manure, poultry droppings. Inorganic: urea, muriate of potash, single superphosphate, ammonium sulphate, NPK.",EX),
S("What is the main difference between an organic and an inorganic",2,"Organic nutrient sources come from the remains or waste of living things; inorganic sources are chemical fertilizers made in a factory.",DIFF),
S("What is the difference between an organic and an inorganic",2,"Organic nutrient sources come from the remains or waste of living things; inorganic sources are chemical fertilizers made in a factory.",DIFF),
S("Name six methods of applying plant nutrients",7,"Broadcasting, placement, the ring method, drilling, foliar application and fertigation. For example, broadcasting is scattering the nutrient source evenly over the whole field.",
  METH+"|Describes one method correctly::scatter,scattering,band,beside,ring,around,seed,spray,sprayed,dissolv,leaves,irrigation"),
S("Name four methods used to apply plant nutrients",4,"Any four of: broadcasting, placement, the ring method, drilling, foliar application, fertigation.",METH),
S("Why must inorganic fertilizers usually be applied in smaller quantities",2,"Inorganic fertilizers are concentrated, so only small amounts are needed, and too much can burn or harm the plant's roots.",
  "They are concentrated::concentrated,strong,potent|Too much can harm or burn the plant::harm,burn,damage,roots,kill"),
S("Explain how the physical appearance of a nutrient source",2,"Organic sources are bulky, so they are spread over the field and mixed or ploughed into the soil in large quantities. Inorganic fertilizers are concentrated granules, so they are broadcast, placed near the roots or dissolved in water in small amounts.",
  "Bulky organic sources are spread or ploughed in, in large quantities::bulky,spread,ploughed,mixed,large quantities|Concentrated granular inorganic fertilizers are broadcast, placed near roots or dissolved in water::granular,concentrated,broadcast,placement,placed,dissolved,small"),
S("Give two examples each of organic and inorganic",4,"Organic: farmyard manure and compost. Inorganic: urea and NPK.",EX),
S("Why do organic nutrient sources need to be applied in larger quantities",2,"Organic sources are bulky and release their nutrients slowly, so a large amount is needed.",
  "They are bulky::bulky,large amounts,bulk|They release nutrients slowly::slowly,slow,weeks,months"),
S("A farmer has very little money to spend",2,"Organic nutrient sources such as manure, because the farmer already has animals that produce manure, so it costs very little.",
  "Organic nutrient source, such as manure::organic,manure,compost|He already owns animals, so the manure costs little or nothing::animals,own,owns,free,cost,cheap,money"),
S("A gardener wants her vegetables to absorb nutrients quickly",3,"An inorganic fertilizer, because it dissolves quickly and releases nutrients fast. She could apply it by foliar spraying, placement near the roots, or dissolved in water (fertigation).",
  "An inorganic fertilizer::inorganic,fertilizer,fertiliser,chemical|It dissolves quickly and releases nutrients fast::dissolve,dissolves,quickly,fast|Apply by foliar spraying, placement or fertigation::foliar,spray,placement,fertigation,water"),
S("A school garden has poor, hard soil",2,"Organic nutrient sources such as manure or compost, because they improve the structure of the soil and help it hold water.",
  "Organic nutrient source such as manure or compost::organic,manure,compost|It improves soil structure and helps the soil hold water::structure,hold water,holds water,water"),
X("Think about everything you have learned about plant nutrients",
  (2,"Organic nutrient sources come from the remains or waste of living things; inorganic sources are chemical fertilizers made in a factory.",DIFF),
  (2,"Organic sources are bulky, release nutrients slowly and improve soil structure. Inorganic sources are concentrated, dissolve quickly and do not improve soil structure.",
   "Organic: bulky, slow release, improve soil structure::bulky,slowly,slow,structure|Inorganic: concentrated, dissolve quickly, do not improve soil structure::concentrated,quickly,dissolve,quick,small"),
  (2,"Bulky organic sources are spread over the field and mixed into the soil in large amounts. Inorganic fertilizers are used in small amounts by broadcasting, placement or dissolving in water.",
   "Organic: spread or ploughed into the soil in large quantities::spread,ploughed,mixed,large,quantities|Inorganic: small amounts by broadcasting, placement or dissolved in water::small,broadcast,placement,dissolved,water,foliar"),
  (2,"For example, use organic manure or compost because it is cheap and improves the soil structure, and add a little inorganic fertilizer if quick results are needed.",
   "Recommends organic, inorganic or both::organic,inorganic,both,compost,manure,fertilizer,fertiliser|Gives a reason (cost, soil structure, speed, safety)::cheap,cost,structure,safe,gentle,quick,quickly,slowly,hold,improve")),
]
