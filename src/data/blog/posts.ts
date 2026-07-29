export interface BlogPost {
  slug: string;
  category: string;
  author: string;
  date: string; // ISO date
  coverGradient: string; // Tailwind gradient classes — no third-party images used
  title: Record<"en" | "sr" | "hu", string>;
  excerpt: Record<"en" | "sr" | "hu", string>;
  body: Record<"en" | "sr" | "hu", string[]>; // paragraphs
}

export const blogPosts: BlogPost[] = [
  {
    slug: "fruska-gora-monastery-circuit",
    category: "Religious and spiritual tourism",
    author: "SMARTour Editorial",
    date: "2026-03-14",
    coverGradient: "from-emerald-700 via-emerald-600 to-lime-600",
    title: {
      en: "Five Fruška Gora Monasteries Worth the Detour",
      sr: "Pet fruškogorskih manastira vrednih obilaska",
      hu: "Öt fruska-gorai kolostor, amelyet érdemes felkeresni",
    },
    excerpt: {
      en: "Sixteen Serbian Orthodox monasteries are scattered across the forested slopes of Fruška Gora. Here are five that give you the fullest sense of the mountain's layered history in a single day.",
      sr: "Šesnaest srpskih pravoslavnih manastira razbacano je po šumovitim padinama Fruške gore. Evo pet koji za jedan dan pružaju najpotpuniji utisak o slojevitoj istoriji ove planine.",
      hu: "Tizenhat szerb ortodox kolostor húzódik a Fruska gora erdős lejtőin. Íme öt, amely egyetlen nap alatt is átfogó képet ad a hegy rétegzett történelméről.",
    },
    body: {
      en: [
        "Fruška Gora rises gently out of the Pannonian plain just north of Novi Sad, and for centuries its forests have sheltered a network of Serbian Orthodox monasteries — sixteen of them still standing, most rebuilt more than once after Ottoman-Habsburg wars swept through the region.",
        "Krušedol is the obvious starting point: founded in the early 1500s by the Branković dynasty, it doubled as a family mausoleum, and Patriarch Arsenije III — who led the Great Migration of the Serbs — is buried here. From there, Novo Hopovo shows off the mountain's artistic side, with 16th-century wall paintings and an 18th-century iconostasis that blend Orthodox tradition with baroque influence from the Habsburg period.",
        "Further along, Vrdnik Monastery (often called Ravanica of Srem) has the most dramatic backstory: it sheltered the relics of Tsar Uroš V, the last ruler of the Nemanjić dynasty, after they were moved here for safekeeping in the 18th century. Today it's also the easiest to combine with a stop at the Vrdnik spa town.",
        "Beočin and Grgeteg round out a good day trip — both quieter, both still active monastic communities rather than tourist sites first. Bring good shoes; the forest roads between them are part of the experience.",
        "Practical note: none of these charge admission, but they are working monasteries, so dress modestly and keep voices down inside the churches.",
      ],
      sr: [
        "Fruška gora se blago izdiže iz panonske ravnice severno od Novog Sada, a njene šume vekovima kriju mrežu srpskih pravoslavnih manastira — šesnaest ih i danas stoji, većina obnavljana više puta nakon ratova između Osmanskog carstva i Habzburške monarhije.",
        "Krušedol je logična polazna tačka: podigla ga je početkom 16. veka porodica Branković, a služio je i kao porodična grobnica. Ovde je sahranjen i patrijarh Arsenije III, koji je predvodio Veliku seobu Srba. Odatle, Novo Hopovo pokazuje umetničku stranu planine, sa freskama iz 16. veka i ikonostasom iz 18. veka koji spaja pravoslavnu tradiciju sa baroknim uticajima.",
        "Manastir Vrdnik (poznat i kao sremska Ravanica) ima najdramatičniju priču: čuvao je mošti cara Uroša V, poslednjeg vladara dinastije Nemanjić, prenete ovde radi zaštite u 18. veku. Danas se lako kombinuje sa posetom banji Vrdnik.",
        "Beočin i Grgeteg zaokružuju dobar jednodnevni izlet — tiši su, i dalje pre svega aktivne monaške zajednice, a ne turističke atrakcije. Ponesite udobnu obuću, šumski putevi između njih deo su doživljaja.",
        "Praktična napomena: nijedan manastir ne naplaćuje ulaz, ali su svi aktivni, pa se u crkvama oblačite skromno i govorite tiho.",
      ],
      hu: [
        "A Fruska gora enyhén emelkedik ki a pannon síkságból Újvidéktől északra, erdei pedig évszázadok óta szerb ortodox kolostorok hálózatát rejtik — ma is tizenhat áll közülük, többségüket többször újjáépítették az oszmán–Habsburg háborúk után.",
        "A Krušedol kolostor a kézenfekvő kiindulópont: a Branković család alapította a 16. század elején, és családi mauzóleumként is szolgált. Itt nyugszik Arsenije III pátriárka is, aki a szerbek nagy exodusát vezette. Innen a Novo Hopovo mutatja meg a hegy művészi oldalát, 16. századi freskóival és 18. századi ikonosztázával.",
        "A Vrdnik kolostor (gyakran szerémségi Ravanicának is nevezik) rendelkezik a legdrámaibb történettel: itt őrizték Uroš cár, a Nemanjić-dinasztia utolsó uralkodójának ereklyéit, miután a 18. században ide menekítették őket. Ma könnyen összeköthető a vrdniki fürdőhely meglátogatásával.",
        "Beočin és Grgeteg teszik teljessé a jó egynapos kirándulást — mindkettő csendesebb, ma is elsősorban működő szerzetesi közösség, nem turistalátványosság. Hozzon kényelmes cipőt, az erdei utak közöttük az élmény része.",
        "Gyakorlati megjegyzés: egyik kolostor sem szed belépődíjat, de működő kolostorokról van szó, ezért öltözzön szerényen, és a templomokban halkan beszéljen.",
      ],
    },
  },
  {
    slug: "exit-festival-first-timers-guide",
    category: "Events and festivals",
    author: "SMARTour Editorial",
    date: "2026-04-02",
    coverGradient: "from-fuchsia-700 via-purple-600 to-indigo-600",
    title: {
      en: "A First-Timer's Guide to EXIT Festival at Petrovaradin Fortress",
      sr: "Vodič za one koji prvi put idu na EXIT festival",
      hu: "Útmutató kezdőknek az EXIT Fesztiválhoz a Péterváradi erődben",
    },
    excerpt: {
      en: "One of Southeast Europe's most influential music festivals happens inside an 18th-century fortress overlooking the Danube. Here's what to know before your first EXIT.",
      sr: "Jedan od najuticajnijih muzičkih festivala jugoistočne Evrope održava se unutar tvrđave iz 18. veka iznad Dunava. Evo šta treba da znate pre prvog EXIT-a.",
      hu: "Délkelet-Európa egyik legbefolyásosabb zenei fesztiválja egy 18. századi erődben zajlik, a Duna fölött. Íme, amit tudni érdemes az első EXIT előtt.",
    },
    body: {
      en: [
        "EXIT Festival began in the early 2000s as a student protest movement and grew into a globally recognized event that now fills Petrovaradin Fortress for several nights every summer. The fortress setting is the whole point: multiple stages are tucked into moats, ramparts, and courtyards, so part of the fun is simply wandering between them.",
        "Novi Sad's city center is a 15–20 minute walk (or a short cab ride across the Varadin bridge) from the fortress, and most festival-goers base themselves there rather than camping, since the city has a dense cluster of short-term rentals within walking distance.",
        "Beyond the music, EXIT has built its identity around activism and civic engagement — panel discussions and partnerships with civil society organizations run alongside the main program, a holdover from its protest-era origins that still shapes the festival's tone.",
        "If it's your first time: bring earplugs for the Dance Arena, comfortable shoes for the fortress's uneven stone paths, and budget an extra day either side to actually see Novi Sad and Petrovaradin without a festival wristband getting in the way.",
      ],
      sr: [
        "EXIT festival je nastao početkom dvehiljaditih kao studentski protestni pokret, a prerastao je u globalno prepoznat događaj koji svakog leta na nekoliko noći ispuni Petrovaradinsku tvrđavu. Ambijent tvrđave je suština doživljaja: bine su smeštene u šančevima, bedemima i dvorištima, pa je deo zabave upravo šetnja između njih.",
        "Centar Novog Sada je udaljen 15–20 minuta hoda (ili kratkom vožnjom taksijem preko Varadinskog mosta) od tvrđave, pa se većina posetilaca smešta u gradu umesto na kampu, jer u blizini postoji gusta mreža kratkoročnih smeštaja.",
        "Osim muzike, EXIT je izgradio identitet oko aktivizma i građanskog angažmana — paneli i saradnja sa organizacijama civilnog društva prate glavni program, nasleđe iz doba protesta koje i dalje oblikuje ton festivala.",
        "Ako idete prvi put: ponesite čepiće za uši za Dance Arenu, udobnu obuću zbog neravnog kamenog terena tvrđave, i planirajte po jedan dodatni dan pre i posle da zaista obiđete Novi Sad i Petrovaradin bez festivalske narukvice.",
      ],
      hu: [
        "Az EXIT Fesztivál a kétezres évek elején diáktiltakozó mozgalomként indult, mára pedig nemzetközileg elismert eseménnyé nőtte ki magát, amely minden nyáron több éjszakára megtölti a Péterváradi erődöt. Az erőd adottsága maga a lényeg: a színpadok árkokban, bástyákon és udvarokban kaptak helyet, így a szórakozás része már a köztük való sétálás is.",
        "Újvidék belvárosa 15–20 perc gyaloglásra van az erődtől (vagy rövid taxiúttal a Várad-hídon át), a legtöbb látogató inkább a városban száll meg, mint sátorban, mivel a közelben sűrű a rövid távú szállások kínálata.",
        "A zene mellett az EXIT identitásának része az aktivizmus és a társadalmi szerepvállalás is — kerekasztal-beszélgetések és civil szervezetekkel való együttműködés kíséri a fő programot, ami a tiltakozó korszak öröksége.",
        "Ha most mész először: hozz füldugót a Dance Arénához, kényelmes cipőt az erőd egyenetlen köves útjaihoz, és tervezz egy-egy plusz napot előtte-utána, hogy fesztiválkarkötő nélkül is felfedezd Újvidéket és Péterváradot.",
      ],
    },
  },
  {
    slug: "slow-afternoon-lake-palic",
    category: "Eco and sustainable tourism initiatives",
    author: "SMARTour Editorial",
    date: "2026-04-20",
    coverGradient: "from-sky-700 via-cyan-600 to-teal-500",
    title: {
      en: "Sunset at Palić: A Slow Afternoon by the Lake",
      sr: "Zalazak sunca na Paliću: mirno popodne kraj jezera",
      hu: "Naplemente Palicson: lassú délután a tónál",
    },
    excerpt: {
      en: "Lake Palić, just outside Subotica, has been a resort town since the Austro-Hungarian era. A century-old water tower, a lakeside zoo, and a flat lap trail make it an easy, unhurried day out.",
      sr: "Palićko jezero, nadomak Subotice, letovalište je još od austrougarskog doba. Vodotoranj star jedan vek, zoološki vrt pored jezera i ravna staza čine ga savršenim za opušten izlet.",
      hu: "A Palicsi-tó, közvetlenül Szabadka mellett, már az Osztrák–Magyar Monarchia óta üdülőhely. Az évszázados víztorony, a tóparti állatkert és a sík körsétány nyugodt, kapkodás nélküli kirándulást ígér.",
    },
    body: {
      en: [
        "Palić has been Subotica's lakeside escape since the late 19th century, when the town was reimagined as a genteel Central European spa resort — the Art Nouveau buildings around the lake are the clearest leftover of that era.",
        "The water tower, completed in 1910, is the town's most photographed landmark: it doubled as the entrance gate to the lake park and, back when Subotica and Palić were connected by an electric tram line, as a tram stop. It still functions today and remains protected as a cultural monument.",
        "A roughly flat, tree-lined path circles the lake — allow 3–4 hours to walk the whole loop at an easy pace, or rent a bicycle and do it in under an hour. The lakeside zoo and the Ludaš Lake bird reserve nearby make Palić an easy pairing with a slower, nature-focused day.",
        "Best time to go: late afternoon into sunset, when the lake's promenades fill with locals rather than day-trip crowds.",
      ],
      sr: [
        "Palić je bio letnje utočište Subotice od kraja 19. veka, kada je mesto zamišljeno kao otmeno srednjoevropsko banjsko lečilište — secesijske zgrade oko jezera najjasniji su ostatak tog doba.",
        "Vodotoranj, završen 1910. godine, najfotografisanija je znamenitost mesta: služio je i kao ulazna kapija u park pored jezera, a nekada, dok su Subotica i Palić bili povezani tramvajskom prugom, i kao tramvajska stanica. Danas i dalje funkcioniše i zaštićen je kao spomenik kulture.",
        "Oko jezera se pruža gotovo ravna, drvoredom obrasla staza — za ceo krug u opuštenom tempu potrebno je 3-4 sata, ili manje od sat vremena biciklom. Zoo vrt pored jezera i rezervat ptica na Ludaškom jezeru u blizini čine Palić pogodnim za mirniji dan u prirodi.",
        "Najbolje vreme za posetu: kasno popodne do zalaska sunca, kada su šetališta puna meštana, a ne dnevnih izletnika.",
      ],
      hu: [
        "Palics a 19. század vége óta Szabadka tóparti menedéke, amikor a települést előkelő közép-európai fürdővárosként képzelték újra — a tó körüli szecessziós épületek ennek a kornak a legvilágosabb emlékei.",
        "Az 1910-ben elkészült víztorony a település legtöbbet fényképezett látványossága: egyszerre szolgált a tóparti park bejáró kapujaként, és — amíg Szabadkát és Palicsot villamosvonal kötötte össze — villamosmegállóként is. Ma is működik, és műemlékként védett.",
        "A tavat egy szinte teljesen sík, fákkal szegélyezett ösvény öleli körül — a teljes kör nyugodt tempóban 3–4 órát vesz igénybe, kerékpárral kevesebb mint egy órát. A közeli tóparti állatkert és a Ludasi-tó madárrezervátuma miatt Palics jól illeszkedik egy lassabb, természetközeli naphoz.",
        "A legjobb időpont: késő délután, egészen naplementéig, amikor a sétányokat inkább a helyiek, nem a napi kirándulók töltik meg.",
      ],
    },
  },
  {
    slug: "cycling-eurovelo6-novi-sad",
    category: "Smart mobility and green transport",
    author: "SMARTour Editorial",
    date: "2026-05-05",
    coverGradient: "from-amber-600 via-orange-600 to-rose-600",
    title: {
      en: "Cycling the EuroVelo 6 Through Novi Sad",
      sr: "Biciklom duž EuroVelo 6 kroz Novi Sad",
      hu: "Kerékpárral az EuroVelo 6 útvonalon Újvidéken át",
    },
    excerpt: {
      en: "The Atlantic–Black Sea cycle route follows the Danube through Novi Sad, linking Begečka jama, the Petrovaradin Fortress, and Sremski Karlovci in one mostly flat, well-marked stretch.",
      sr: "Ruta EuroVelo 6, koja povezuje Atlantik i Crno more, prati Dunav kroz Novi Sad, spajajući Begečku jamu, Petrovaradinsku tvrđavu i Sremske Karlovce jednom uglavnom ravnom, dobro obeleženom deonicom.",
      hu: "Az Atlanti-óceánt és a Fekete-tengert összekötő EuroVelo 6 útvonal a Dunát követve halad át Újvidéken, összekapcsolva a Begečka jamát, a Péterváradi erődöt és Sremski Karlovcit egyetlen, többnyire sík, jól jelzett szakaszon.",
    },
    body: {
      en: [
        "EuroVelo 6 runs the length of the Danube from the Atlantic to the Black Sea, and the stretch through Novi Sad is one of its more rewarding urban sections — mostly separated cycling path, mostly flat, and mostly right on the water.",
        "Coming from the north, the route enters Serbia near Bački Breg and eventually reaches Novi Sad along the Danube's left-bank levee, passing riverside spots like Begečka jama nature park before threading through the city's Sunčani kej and Kej žrtava racije embankments.",
        "The Varadinska duga bridge is the crossing point into Petrovaradin, after which the route continues toward Sremski Karlovci — a baroque small town worth an unhurried stop for its wine cellars and Chapel of Peace, site of the 1698–99 treaty negotiations that redrew the map of Central Europe.",
        "The Begečka jama-to-Varadinska duga section is largely a dedicated bike path rather than shared road, which makes it a solid choice for a family day out as much as for touring cyclists doing longer stages.",
      ],
      sr: [
        "EuroVelo 6 prati tok Dunava od Atlantika do Crnog mora, a deonica kroz Novi Sad jedna je od njenih najatraktivnijih urbanih deonica — uglavnom odvojena biciklistička staza, uglavnom ravna, i uglavnom neposredno uz vodu.",
        "Dolazeći sa severa, ruta ulazi u Srbiju kod Bačkog Brega i vodi do Novog Sada nasipom na levoj obali Dunava, prolazeći pored Begečke jame pre nego što se provuče kroz gradski Sunčani kej i Kej žrtava racije.",
        "Most Varadinska duga je tačka prelaska u Petrovaradin, odakle ruta nastavlja ka Sremskim Karlovcima — baroknom gradiću vrednom mirne posete zbog vinskih podruma i Kapele mira, mesta gde su 1698-99. vođeni pregovori koji su promenili kartu srednje Evrope.",
        "Deonica od Begečke jame do mosta Varadinska duga uglavnom je posebna biciklistička staza, a ne deljeni put, što je čini dobrim izborom i za porodični izlet i za bicikliste koji voze duže etape.",
      ],
      hu: [
        "Az EuroVelo 6 a Duna teljes hosszát követi az Atlanti-óceántól a Fekete-tengerig, az újvidéki szakasz pedig az egyik legszebb városi része — jórészt önálló kerékpárút, többnyire sík, és szinte mindvégig a víz mellett halad.",
        "Északról érkezve az útvonal Bački Breg közelében lép Szerbiába, majd a Duna bal parti töltésén jut el Újvidékig, elhaladva a Begečka jama természeti park mellett, mielőtt áthaladna a város Sunčani kej és Kej žrtava racije rakpartjain.",
        "A Varadinska duga híd jelenti az átkelést Péterváradra, ahonnan az útvonal Sremski Karlovci felé folytatódik — egy barokk kisváros, amelyet érdemes nyugodtan felfedezni borospincéi és a Békekápolna miatt, ahol 1698–99-ben azok a tárgyalások zajlottak, amelyek átrajzolták Közép-Európa térképét.",
        "A Begečka jama és a Varadinska duga híd közötti szakasz nagyrészt önálló kerékpárút, nem közös úthasználat, ezért családi kirándulásra és hosszabb távokat tekerő túrázóknak egyaránt jó választás.",
      ],
    },
  },
];
