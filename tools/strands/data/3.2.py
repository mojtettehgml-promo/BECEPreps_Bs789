from common import S,X
PL="Mercury::mercury|Venus::venus|Earth::earth|Mars::mars"
ALL8="Mercury::mercury|Venus::venus|Earth::earth|Mars::mars|Jupiter::jupiter|Saturn::saturn|Uranus::uranus|Neptune::neptune"
GAL="A very large group of stars, gas and dust::stars,gas,dust,group|Held together by gravity::gravity,held"
HOT="Venus has a thick atmosphere of mostly carbon dioxide::thick,atmosphere,carbon dioxide|It traps heat in a strong greenhouse effect::trap,traps,heat,greenhouse|Mercury has almost no atmosphere so it cannot hold heat::no atmosphere,almost no,cannot hold"
ROT="Revolution is the motion of a planet along its orbit around the Sun::revolution,orbit,around the sun|Rotation is the spinning of the planet on its axis::rotation,spin,spinning,axis"
NEAR="Their orbits lie inside the Earth's orbit::inside,orbit|So they always appear fairly close to the Sun in the sky::close to the sun,near the sun,close,near"
QA=[
S("Name the four inner planets in order",4,"Mercury, Venus, Earth and Mars.",PL),
S("Describe the Milky Way in two sentences",2,"The Milky Way is the galaxy that contains our solar system. It is a spiral galaxy with hundreds of billions of stars, and the Sun is only one of them.",
  "It is the galaxy that contains the solar system::galaxy,solar system|It is a spiral with hundreds of billions of stars::spiral,billions,stars"),
S("State what shape the orbit of a planet has",2,"The orbit is an ellipse (a slightly flattened circle), and the Sun is at a point inside it called a focus, not at the exact centre.",
  "The orbit is an ellipse, a slightly flattened circle::ellipse,elliptical,flattened,oval|The Sun is at a focus inside it, not at the centre::focus,not at the centre,not at the exact centre,inside"),
S("Explain why the inner planets are called terrestrial planets",2,"They are called terrestrial planets because, like the Earth, they have solid rocky surfaces.",
  "They have solid rocky surfaces::solid,rocky,rock|Like the Earth::earth,like"),
S("State three properties of Mercury",3,"Mercury is the smallest planet and the closest to the Sun, has no moons or rings, almost no atmosphere, a cratered rocky surface and a very large temperature range.",
  "Smallest planet::smallest,small|Closest planet to the Sun::closest,nearest|No moons or rings::no moons,no rings,moons|Almost no atmosphere::no atmosphere,atmosphere|Very hot by day and very cold at night::430,180,hot,cold,temperature|Rocky, cratered surface like the Moon::crater,cratered,rocky,moon|Iron rich core::iron,core"),
S("State two properties of Mercury",2,"Mercury is the smallest planet and the closest to the Sun, with no moons and almost no atmosphere.",
  "Smallest planet::smallest,small|Closest planet to the Sun::closest,nearest|No moons or rings::no moons,no rings,moons|Almost no atmosphere::no atmosphere,atmosphere|Cratered surface::crater,cratered,rocky"),
S("State three properties of Venus",3,"Venus is almost the same size as the Earth, has no moons, is the hottest planet (about 465 degrees Celsius), has a thick carbon dioxide atmosphere and clouds of sulphuric acid, and is the brightest planet in our sky.",
  "Almost the same size as the Earth::same size,earth's twin,twin,size|No moons or rings::no moons,no rings,moons|Hottest planet::hottest,465,hot|Thick carbon dioxide atmosphere::thick,carbon dioxide,atmosphere|Clouds of sulphuric acid::sulphuric,acid,clouds|Brightest planet in our sky::brightest,bright"),
S("Explain why Venus is hotter than Mercury",3,"Venus has a thick carbon dioxide atmosphere that traps heat in a strong greenhouse effect, while Mercury has almost no atmosphere and cannot hold heat.",HOT),
S("A learner says Mercury must be the hottest planet",3,"Venus is hotter. It is wrapped in a thick carbon dioxide atmosphere that traps heat (greenhouse effect), while Mercury has almost no atmosphere and loses its heat at night.",
  "Venus is the hottest planet, not Mercury::venus|Venus has a thick carbon dioxide atmosphere that traps heat::thick,carbon dioxide,atmosphere,trap,greenhouse|Mercury has almost no atmosphere so it cannot hold heat::no atmosphere,almost no,cannot hold,cold at night"),
S("Describe the difference between the revolution and the rotation",2,"Revolution is the motion of a planet along its orbit around the Sun; rotation is the spinning of a planet on its own axis.",ROT),
S("Define the rotation of a planet",1,"Rotation is the spinning of a planet on its own axis.","Spinning on its own axis::spin,spinning,axis,turning"),
S("Name the star at the centre of the solar system",1,"The Sun.","The Sun::sun"),
S("List the eight planets in order",8,"Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.",ALL8),
S("What is a galaxy",2,"A galaxy is a very large group of stars, gas and dust held together by gravity.",GAL),
S("State two features that all the inner planets share",2,"They have solid rocky surfaces, are smaller and denser than the outer planets, have few or no moons and have no rings.",
  "Solid rocky surfaces::solid,rocky,rock|Smaller and denser than the outer planets::smaller,denser|Few or no moons::few moons,no moons,moons|No rings::no rings,rings"),
S("Name the planet that is called the Earth's twin",2,"Venus, because it is almost the same size as the Earth.","Venus::venus|It is almost the same size as the Earth::size,same size"),
S("Why is the orbit of a planet described as elliptical",1,"Because the orbit is not a perfect circle but a slightly flattened circle called an ellipse.","It is a slightly flattened circle, not a perfect circle::flattened,not a perfect circle,oval,ellipse"),
S("Why do Mercury and Venus appear close to the Sun",2,"Their orbits lie inside the Earth's orbit, so they always appear fairly close to the Sun in the sky.",NEAR),
S("Why is a day on Venus longer than its year",2,"Venus takes about 243 Earth days to spin once (a day) but only about 225 Earth days to go round the Sun (a year).",
  "A rotation takes about 243 Earth days::243,rotates very slowly,spin|A revolution takes about 225 Earth days::225,revolution,orbit,year"),
S("An observer sees a bright object low in the west",3,"It may be Venus, the evening star. Its orbit is inside the Earth's orbit, so it stays close to the Sun in the sky and sets soon after the Sun, so it is never seen at midnight.",
  "It may be Venus::venus|Its orbit is inside the Earth's orbit so it stays close to the Sun::inside,close to the sun,near the sun|It sets soon after the Sun so it is not seen at midnight::sets,midnight,after sunset,not seen"),
S("A model of the solar system is to be built in a school compound",2,"The distances between planets are so large that a model with correct distances would not fit in the compound.",
  "The distances between the planets are very large::large,huge,far,distances|A model with true distances would not fit in the space::not fit,too big,cannot fit,space"),
S("A year on Mercury is about 88 Earth days",2,"Mercury moves faster than Mars because it is closer to the Sun and completes one orbit in a shorter time (Mars takes 687 days).",
  "Mercury travels faster::faster,fast,speed|Closer planets take less time to complete an orbit::less time,shorter,closer,687"),
S("State two properties of Mars",2,"Any two of: it is about half the width of the Earth, it has a thin atmosphere mostly of carbon dioxide, it has very cold nights, it has a red surface of iron rich dust and rock, it has two tiny moons, Phobos and Deimos, it has the tallest volcano known, Olympus Mons.","Half the width of the Earth::half,width,small|Thin atmosphere mostly of carbon dioxide::thin,atmosphere,carbon dioxide|Very cold nights::cold|Red surface::red,iron|Two tiny moons::two moons,two tiny,phobos,deimos,moons|Tallest volcano::volcano,olympus"),
S("Give two reasons why the Earth is able to support life",2,"The Earth has liquid water on its surface, an atmosphere with oxygen and a moderate temperature.","Liquid water::water|Atmosphere with oxygen::oxygen,atmosphere|Moderate temperature::temperature,moderate,warm"),
]
