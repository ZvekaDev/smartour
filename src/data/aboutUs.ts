import type { Locale } from "../i18n/ui";

type L = Record<Locale, string>;

/**
 * Content supplied by the user for the About Us page, translated to SR/HU.
 * One correction applied throughout: the source copy referenced "English,
 * Serbian, Hungarian and Romanian" / a "4 Languages" stat, but the site's
 * actual scope (per the original brief) is 3 languages — EN/SR/HU. Both
 * are corrected here; flagged to the user when this file was written.
 */
export const aboutUs = {
  heroTitle: {
    en: "About Us",
    sr: "O nama",
    hu: "Rólunk",
  } satisfies L,
  heroSubtitle: {
    en: "Connecting travelers with unforgettable experiences across borders",
    sr: "Povezujemo putnike sa nezaboravnim iskustvima širom granica",
    hu: "Utazókat kapcsolunk össze felejthetetlen, határokon átnyúló élményekkel",
  } satisfies L,

  whoWeAreTagline: {
    en: "Who We Are",
    sr: "Ko smo mi",
    hu: "Kik vagyunk",
  } satisfies L,
  whoWeAreHeading: {
    en: "Bridging Cultures Through Travel",
    sr: "Povezujemo kulture kroz putovanje",
    hu: "Kultúrákat összekötő utazás",
  } satisfies L,
  whoWeAreParagraphs: {
    en: [
      "The goal of the project is to introduce the achievements of SMART TOURISM, i.e. the integration of DIGITAL TECHNOLOGIES AND ARTIFICIAL INTELLIGENCE in the development of tourist destinations. The smart tourism platform that will be jointly created can be considered a new tourism model as a pilot for the development of smart tourism in both countries.",
      "The platform will include joint information management for tourism and cultural purposes, providing information and support, as well as creating fully personalized tours.",
    ],
    sr: [
      "Cilj projekta je da predstavi dostignuća PAMETNOG TURIZMA, odnosno integraciju DIGITALNIH TEHNOLOGIJA I VEŠTAČKE INTELIGENCIJE u razvoj turističkih destinacija. Platforma pametnog turizma koja će biti zajednički kreirana može se smatrati novim modelom turizma, pilot projektom za razvoj pametnog turizma u obe zemlje.",
      "Platforma će obuhvatiti zajedničko upravljanje informacijama u turističke i kulturne svrhe, pružajući informacije i podršku, kao i kreiranje potpuno personalizovanih tura.",
    ],
    hu: [
      "A projekt célja az OKOS TURIZMUS eredményeinek bemutatása, vagyis a DIGITÁLIS TECHNOLÓGIÁK ÉS A MESTERSÉGES INTELLIGENCIA integrálása a turisztikai desztinációk fejlesztésébe. A közösen létrehozott okosturizmus-platform mindkét ország számára új turisztikai modellként, pilot projektként szolgál.",
      "A platform közös információkezelést biztosít turisztikai és kulturális célokra, tájékoztatást és támogatást nyújt, valamint teljes mértékben személyre szabott túrákat hoz létre.",
    ],
  } satisfies Record<Locale, string[]>,

  stats: [
    { number: "500+", label: { en: "Travel Offers", sr: "Turističkih ponuda", hu: "Utazási ajánlat" } satisfies L },
    { number: "50+", label: { en: "Partner Agencies", sr: "Partnerskih agencija", hu: "Partnerügynökség" } satisfies L },
    { number: "3", label: { en: "Languages", sr: "Jezika", hu: "Nyelv" } satisfies L },
  ],

  missionTagline: { en: "Our Mission", sr: "Naša misija", hu: "Küldetésünk" } satisfies L,
  missionParagraph: {
    en: "During the project implementation, digital signage machines will be installed at various locations in the Pannonian region, serving as a one-stop tourist information point that will help streamline multiple processes, inform visitors about local events and tourist attractions, provide user support while improving visitor experience, reducing staff costs and increasing customer satisfaction.",
    sr: "Tokom realizacije projekta, digitalni info-terminali biće postavljeni na različitim lokacijama u panonskom regionu, služeći kao jedinstvena turistička informativna tačka koja pomaže da se pojednostave brojni procesi, informiše posetioce o lokalnim događajima i turističkim atrakcijama, pruži korisnička podrška uz poboljšanje iskustva posetilaca, smanjenje troškova osoblja i povećanje zadovoljstva korisnika.",
    hu: "A projekt megvalósítása során digitális információs terminálokat telepítenek a pannon régió különböző helyszínein, amelyek egyablakos turisztikai információs pontként működnek, segítve számos folyamat egyszerűsítését, tájékoztatva a látogatókat a helyi eseményekről és látnivalókról, ügyfélszolgálati támogatást nyújtva, miközben javítják a látogatói élményt, csökkentik a személyzeti költségeket és növelik az ügyfél-elégedettséget.",
  } satisfies L,

  visionTagline: { en: "Our Vision", sr: "Naša vizija", hu: "Jövőképünk" } satisfies L,
  visionParagraph: {
    en: "In addition, tools using artificial intelligence will be developed to provide unique tourism offers based on personal preferences regarding cross-border thematic routes based on cultural heritage and natural treasures.",
    sr: "Pored toga, biće razvijeni alati zasnovani na veštačkoj inteligenciji koji će pružati jedinstvene turističke ponude prilagođene ličnim preferencijama, u vidu prekograničnih tematskih ruta zasnovanih na kulturnom nasleđu i prirodnim bogatstvima.",
    hu: "Emellett mesterséges intelligencián alapuló eszközök is kifejlesztésre kerülnek, amelyek a személyes preferenciák alapján egyedi turisztikai ajánlatokat kínálnak, a kulturális örökségre és természeti kincsekre épülő, határon átnyúló tematikus útvonalak formájában.",
  } satisfies L,

  offerHeading: { en: "What We Offer", sr: "Šta nudimo", hu: "Mit kínálunk" } satisfies L,
  offerSubheading: {
    en: "Everything you need to plan the perfect cross-border adventure",
    sr: "Sve što vam je potrebno za planiranje savršene prekogranične avanture",
    hu: "Minden, amire szüksége van a tökéletes határon átnyúló kaland megtervezéséhez",
  } satisfies L,
  offerCards: [
    {
      icon: "🗂️",
      title: { en: "Curated Offers", sr: "Odabrane ponude", hu: "Válogatott ajánlatok" } satisfies L,
      text: {
        en: "Hand-picked travel packages from trusted agencies across the region.",
        sr: "Pažljivo odabrani turistički paketi od pouzdanih agencija širom regiona.",
        hu: "Gondosan válogatott utazási csomagok a régió megbízható ügynökségeitől.",
      } satisfies L,
    },
    {
      icon: "🌐",
      title: { en: "Multilingual", sr: "Višejezično", hu: "Többnyelvű" } satisfies L,
      text: {
        en: "Content available in English, Serbian and Hungarian.",
        sr: "Sadržaj dostupan na engleskom, srpskom i mađarskom jeziku.",
        hu: "A tartalom angol, szerb és magyar nyelven érhető el.",
      } satisfies L,
    },
    {
      icon: "✅",
      title: { en: "Verified Agencies", sr: "Proverene agencije", hu: "Ellenőrzött ügynökségek" } satisfies L,
      text: {
        en: "All partner organizations are vetted for quality and reliability.",
        sr: "Sve partnerske organizacije su proverene u pogledu kvaliteta i pouzdanosti.",
        hu: "Minden partnerszervezet minőség és megbízhatóság szempontjából ellenőrzött.",
      } satisfies L,
    },
    {
      icon: "📖",
      title: { en: "Travel Stories", sr: "Priče sa putovanja", hu: "Utazási történetek" } satisfies L,
      text: {
        en: "Read inspiring blogs and travel guides from our community.",
        sr: "Čitajte inspirativne blogove i vodiče za putovanja naše zajednice.",
        hu: "Olvasson inspiráló blogokat és útikalauzokat közösségünktől.",
      } satisfies L,
    },
  ],

  storyTagline: { en: "Our Story", sr: "Naša priča", hu: "Történetünk" } satisfies L,
  storyHeading: {
    en: "How It All Started",
    sr: "Kako je sve počelo",
    hu: "Hogyan kezdődött minden",
  } satisfies L,
  storyParagraph: {
    en: "The project is supported within the IPA Cross-Border Cooperation Programme Serbia-Hungary (HUSRB/23R/22/004).",
    sr: "Projekat je podržan u okviru IPA programa prekogranične saradnje Srbija-Mađarska (HUSRB/23R/22/004).",
    hu: "A projektet az IPA Szerbia-Magyarország Határon Átnyúló Együttműködési Program (HUSRB/23R/22/004) támogatja.",
  } satisfies L,

  ctaHeading: { en: "Ready to Explore?", sr: "Spremni za istraživanje?", hu: "Készen áll a felfedezésre?" } satisfies L,
  ctaText: {
    en: "Join our community and discover travel opportunities across the region.",
    sr: "Pridružite se našoj zajednici i otkrijte mogućnosti za putovanja širom regiona.",
    hu: "Csatlakozzon közösségünkhöz, és fedezze fel a régió utazási lehetőségeit.",
  } satisfies L,
};
