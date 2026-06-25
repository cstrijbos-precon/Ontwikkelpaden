import type { Pad, PadId } from "@/types/ontwikkelpaden";

export const PADEN: Record<PadId, Pad> = {
  vakexpert: {
    label: "Vakexpert",
    kleur: "vakexpert",
    rollen: [
      "Consultant",
      "Deskundige",
      "Vakdeskundige",
      "Inhoudsdeskundige",
      "Visionair",
    ],
    vereisten: [
      { b: 1, k: 1, o: 1, org: 1 },
      { b: 1, k: 1, o: 2, org: 1 },
      { b: 2, k: 2, o: 2, org: 1 },
      { b: 3, k: 3, o: 3, org: 2 },
      { b: 3, k: 4, o: 3, org: 3 },
    ],
    toolboxen: {
      2: {
        vereist: [
          "Kerncompetenties behalen",
          "Verdieping T-profiel",
          "Talk of presentatie geven op ontwikkeldag",
          "Vakgroep activiteiten ontplooien",
        ],
        zelfDoen: [
          "Inhoudelijk werk uitvoeren en ervaring opdoen",
          "Vakliteratuur bijhouden",
          "Website tekst/LinkedIn bericht voor Précon schrijven (onder toezicht van inhoudsdeskundige)",
        ],
        systemen: ["Elzi", "AFAS basis"],
        collega: [
          "Feedback vragen van collega's over inhoudelijk werk",
        ],
        trainingen: [
          "Training over inhoudelijk onderwerp volgen",
          "Trainingslijn 'Vakexpert 1' volgen",
        ],
      },
      3: {
        vereist: [
          "Kerncompetenties behalen",
          "Verdieping T-profiel",
          "Vakliteratuur bijhouden op eigen vakgebied",
          "Vakgroep activiteiten ontplooien",
        ],
        zelfDoen: [
          "Inhoudelijk werk uitvoeren, wees kritisch op methodieken",
          "Meehelpen met organiseren kennismiddagen",
          "Website teksten/artikelen schrijven voor Précon",
          "In gesprek met klanten over ontwikkelingen",
          "Wijzigingen/wetgeving bijhouden in vakgebied",
        ],
        systemen: [],
        collega: [
          "Feedback vragen over inhoudelijk werk",
          "Sparren met collega's over ontwikkelingen",
        ],
        trainingen: [
          "Training over inhoudelijk onderwerp volgen",
          "Trainingslijn 'Vakexpert 2' volgen",
        ],
      },
      4: {
        vereist: [
          "Kerncompetenties behalen",
          "Verdieping T-profiel",
          "Als inhoudsdeskundige samen met accountmanager klanten bezoeken",
          "Artikelen schrijven in vakbladen/websites",
          "Symposia/congressen/beurzen bezoeken",
        ],
        zelfDoen: [
          "Vakinhoudelijk uitdagend werk uitvoeren",
          "Programma voor kennismiddagen opzetten",
          "Lid van netwerkgroepen/commissies",
          "Meewerken aan innovaties",
        ],
        systemen: [],
        collega: [
          "Feedback vragen over inhoudelijk werk",
          "Sparren over inhoudelijk werk en innovaties",
        ],
        trainingen: [
          "Training over inhoudelijk onderwerp ontwikkelen en geven",
          "Vakinhoudelijke trainingen volgen",
          "Trainingslijn 'Vakexpert 3' volgen",
        ],
      },
      5: {
        vereist: [
          "Kerncompetenties behalen",
          "Innovaties initiëren op toekomstanticipatie",
          "Lezingen/workshops geven op congressen",
          "Kennismiddagen initiëren",
        ],
        zelfDoen: [
          "Boek(en) schrijven of inhoudelijke video's maken",
          "Lid van netwerkgroepen/commissies",
          "Creatieve oplossingen bedenken voor inhoudelijke problemen",
          "Sparren met externe deskundigen",
        ],
        systemen: [],
        collega: [
          "Feedback vragen over inhoudelijk werk",
          "Sparren over ideeën en oplossingen",
        ],
        trainingen: [
          "Training over inhoudelijk onderwerp geven",
          "Trainingen over inspireren van anderen",
          "Trainingslijn 'Vakexpert 4' volgen",
        ],
      },
    },
  },
  adviseur: {
    label: "Adviseur",
    kleur: "adviseur",
    rollen: [
      "Consultant",
      "Commercieel onverdachte consultant",
      "Consultant & hunter",
      "Accountmanager",
      "Strategisch accountmanager",
    ],
    vereisten: [
      { b: 1, k: 1, o: 1, org: 1 },
      { b: 1, k: 2, o: 2, org: 1 },
      { b: 2, k: 3, o: 2, org: 1 },
      { b: 3, k: 3, o: 3, org: 2 },
      { b: 4, k: 4, o: 4, org: 3 },
    ],
    toolboxen: {
      2: {
        vereist: ["Kerncompetenties behalen", "T-profiel verbreden"],
        zelfDoen: [
          "Meer leren over Précon aanbod door gesprekken met collega's",
          "Verdiepen in Précon storyboard",
          "Gesprekken voeren met salesmanager over klant",
        ],
        systemen: ["AFAS: offertes vinden, klant historie vinden"],
        collega: [
          "Samenwerken met medior/senior collega en sparren over latente behoeften",
          "Gesprek voeren met business manager over haakjes bij klant",
        ],
        trainingen: ["Trainingslijn 'Adviseur 1' volgen"],
      },
      3: {
        vereist: ["Kerncompetenties behalen", "T-profiel verbreden"],
        zelfDoen: [
          "Verdiepen in Précon storyboard",
          "Gesprekken voeren met contactpersoon bij klant",
        ],
        systemen: [
          "AFAS: offertes koppelen, klantbeheer: workflow rondom sales",
        ],
        collega: [
          "Meekijken met ervaren salesmanager",
          "Overtuigingskracht oefenen en feedback vragen",
        ],
        trainingen: ["Trainingslijn 'Adviseur 2' volgen"],
      },
      4: {
        vereist: [
          "Kerncompetenties behalen",
          "T-profiel verbreden",
          "Eigen maken van de rol van accountmanager",
          "Proactief klantcontact onderhouden",
        ],
        zelfDoen: [
          "Proactief op de hoogte blijven van markt bij klanten",
          "Proactief volgen van Précon dienstenontwikkelingen",
        ],
        systemen: [
          "AFAS: Accountmanagement: klantsegmentatiecriteria, contactstructuurstrategie, CRM strategie",
        ],
        collega: [
          "Actief meedraaien met gesprekken onder leiding van accountmanager",
          "Overtuigingskracht oefenen en feedback vragen",
        ],
        trainingen: ["Trainingslijn 'Adviseur 3' volgen"],
      },
      5: {
        vereist: [
          "Kerncompetenties behalen",
          "T-profiel verbreden",
          "Proactief klantcontact onderhouden op strategisch niveau",
        ],
        zelfDoen: [
          "Proactief op de hoogte van markt en klanten",
          "Proactief volgen van Précon dienstenontwikkelingen",
        ],
        systemen: [
          "AFAS: Accountmanagement: klantsegmentatiecriteria, contactstructuurstrategie, CRM strategie",
        ],
        collega: [
          "Actief meedraaien met strategische gesprekken onder strategisch accountmanager",
        ],
        trainingen: ["Trainingslijn 'Adviseur 4' volgen"],
      },
    },
  },
  leider: {
    label: "Leider",
    kleur: "leider",
    rollen: [
      "Consultant",
      "Buddy/Sparringspartner",
      "Projectleider",
      "Business manager",
      "MT-lid",
    ],
    vereisten: [
      { b: 1, k: 1, o: 1, org: 1 },
      { b: 2, k: 1, o: 1, org: 2 },
      { b: 3, k: 2, o: 2, org: 3 },
      { b: 4, k: 3, o: 3, org: 3 },
      { b: 4, k: 4, o: 4, org: 3 },
    ],
    toolboxen: {
      2: {
        vereist: [
          "Kerncompetenties behalen",
          "Goed luisteren, nieuwsgierig zijn en oprechte interesse tonen in de ander",
        ],
        zelfDoen: [
          "Bewustzijn van jezelf en je invloed op anderen",
          "Oefenen met zelf leiding nemen en grip houden op gesprek",
          "Oefenen met 'geven van de hengel in plaats van de vis'",
        ],
        systemen: [
          "Documenten in Quasydoc kennen zodat je collega's kan inwerken",
        ],
        collega: [
          "Feedback vragen",
          "Sparren met medior en senior collega's over jouw rol",
        ],
        trainingen: ["Trainingslijn 'Leider 1' volgen"],
      },
      3: {
        vereist: [
          "Kerncompetenties behalen",
          "T-profiel verbreden en verdiepen",
        ],
        zelfDoen: [
          "3 ankers van Précon bewust balanceren (klant/medewerker/Précon)",
          "Overleg voorzitten",
          "Gesprek met klant voeren",
          "Welzijn teamleden monitoren",
          "Kwaliteit van werk borgen",
          "Leiderschapsstijl van Précon begrijpen en naleven",
        ],
        systemen: ["AFAS: projectinformatie, uren uitdraaien"],
        collega: [
          "Afstemming met business manager",
          "Afstemming met andere projectleiders",
          "Feedback vragen over leiderschapsstijl",
        ],
        trainingen: [
          "Trainingslijn 'Leider 2' volgen",
          "Project planning/time management cursus",
        ],
      },
      4: {
        vereist: [
          "Kerncompetenties behalen",
          "T-profiel verbreden en verdiepen",
          "Leiderschapsstijl Précon begrijpen en naleven",
          "Kwetsbaar durven opstellen",
        ],
        zelfDoen: [
          "3 ankers bewust balanceren",
          "Gesprekken met klant voeren als business manager",
          "Welzijn en ontwikkeling van teamleden begeleiden",
          "Business plan en doelstellingen doornemen",
        ],
        systemen: [
          "AFAS: HRM portal, klantkaart, offertes, geschreven uren",
          "Declarabiliteit en omzetcijfers begrijpen en monitoren",
        ],
        collega: [
          "Afstemming met MT-lid (1:1 begeleiding of coaching)",
          "Introductie door mede business manager in nieuwe medewerker begeleiden",
        ],
        trainingen: ["Trainingslijn 'Leider 3' volgen"],
      },
      5: {
        vereist: [
          "Kerncompetenties behalen",
          "Strategisch leiderschap tonen",
          "Organisatiebrede vraagstukken aansturen",
        ],
        zelfDoen: [
          "Strategische klantrelaties onderhouden",
          "Innovaties in de organisatie aanjagen",
          "Anderen inspireren en ontwikkelen",
        ],
        systemen: [],
        collega: [
          "Sparren met andere MT-leden",
          "Coaching ontvangen op strategisch niveau",
        ],
        trainingen: ["Leiderschapstrainingen op strategisch niveau"],
      },
    },
  },
  trainer: {
    label: "Trainer",
    kleur: "trainer",
    rollen: [
      "Consultant",
      "Trainer vakkennis",
      "Coachende trainer",
      "Begeleider groepsprocessen",
      "Begeleider ontwikkel- en cultuurtrajecten",
    ],
    vereisten: [
      { b: 1, k: 1, o: 1, org: 1, t: 1 },
      { b: 2, k: 2, o: 1, org: 2, t: 2 },
      { b: 3, k: 3, o: 2, org: 3, t: 3 },
      { b: 4, k: 3, o: 3, org: 3, t: 4 },
      { b: 4, k: 4, o: 4, org: 4, t: 4 },
    ],
    toolboxen: {
      2: {
        vereist: [
          "Kerncompetenties behalen",
          "Ervaren in vakgebied óf ervaren trainer",
          "Selectiegesprek met interne trainersopleider (beoordeling trainerscompetenties 1 ster)",
          "Getraind zijn in 1 Précon training (3-stappen-opleiding)",
        ],
        zelfDoen: [
          "Interesse in trainerschap kenbaar maken en selectiegesprek inplannen",
          "Meelopen om te leren van ervaren trainers",
          "Starten met co-trainen",
        ],
        systemen: [
          "Kennis van online omgevingen in Elzi",
          "Kennis van processen rond OI en IC trainingen",
        ],
        collega: [
          "3-stappen-opleiding: meekijken → co-training → zelf geven onder supervisie",
          "Leren van ervaren trainer, Training Support en Planning: afspraken rond voorbereiding-trainen-afronding",
        ],
        trainingen: [
          "Karin de Galan introductie (1 dagdeel)",
          "Trainingslijn 'Leider 1' volgen",
        ],
      },
      3: {
        vereist: [
          "Kerncompetenties behalen",
          "Meerdere Précon trainingen kunnen geven",
        ],
        zelfDoen: [
          "Zelf trainingen ontwerpen",
          "Draaiboeken maken met logische opbouw",
          "Flexibel inspelen op deelnemersbehoeften terwijl je de regie houdt",
        ],
        systemen: [],
        collega: [
          "Feedback vragen van ervaren trainers",
          "Intervisie met andere trainers",
        ],
        trainingen: [
          "Karin de Galan verdieping",
          "Trainingslijn 'Trainer 2' volgen",
        ],
      },
      4: {
        vereist: [
          "Kerncompetenties behalen",
          "Groepsprocessen kunnen begeleiden",
        ],
        zelfDoen: [
          "Kennis van groepsdynamica inzetten",
          "Maatwerk trajecten ontwikkelen voor klanten",
          "Opdrachtgevers betrekken bij ontwerp trainingstraject",
        ],
        systemen: [],
        collega: [
          "Sparren met senior trainers over complexe groepssituaties",
        ],
        trainingen: [
          "Verdiepingstraining groepsdynamica",
          "Trainingslijn 'Trainer 3' volgen",
        ],
      },
      5: {
        vereist: [
          "Kerncompetenties behalen",
          "Organisatiebrede ontwikkeltrajecten begeleiden",
        ],
        zelfDoen: [
          "Cultuurveranderingstrajecten begeleiden",
          "McClelland/Bateson en Lencioni toepassen",
          "Klanten inzicht geven in bovenstroom en onderstroom",
        ],
        systemen: [],
        collega: [
          "Sparren met MT over organisatiebrede vraagstukken",
        ],
        trainingen: [
          "Opleiding organisatieontwikkeling",
          "Trainingslijn 'Trainer 4' volgen",
        ],
      },
    },
  },
};

export const PAD_IDS = Object.keys(PADEN) as PadId[];
