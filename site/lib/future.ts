import { Factory, Flask, Heartbeat, Pill, Planet, Pulse, ShootingStar, Sun, Warning, WaveSine } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export type Source = { label: string; href: string };
export type Stake = { figure: string; line: string; sources: Source[]; lead?: boolean };
export type Application = { domain: string; figure: string; line: string; icon: Icon; sources: Source[] };

export const STAKES: Stake[] = [
  {
    figure: "41 → 0",
    line: "An autonomous lab claimed 41 new compounds. A 2024 recheck found none were new. A sealed holdout is built to catch exactly this.",
    lead: true,
    sources: [
      { label: "Nature 2023", href: "https://www.nature.com/articles/s41586-023-06734-w" },
      { label: "Chemistry World", href: "https://www.chemistryworld.com/news/new-analysis-raises-doubts-over-autonomous-labs-materials-discoveries/4018791.article" },
    ],
  },
  {
    figure: "$28B",
    line: "is spent each year in the US on preclinical research that doesn't reproduce.",
    sources: [{ label: "Freedman et al. 2015", href: "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1002165" }],
  },
  {
    figure: "6 of 53",
    line: "landmark cancer studies could be reproduced by Amgen.",
    sources: [{ label: "eLife", href: "https://elifesciences.org/articles/67527" }],
  },
  {
    figure: "79,920",
    line: "life-years are saved for each year a cancer drug reaches approval sooner.",
    sources: [{ label: "Stewart et al. 2018", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5943431/" }],
  },
  {
    figure: "885 of 7,931",
    line: "TESS candidates have been confirmed so far.",
    sources: [
      { label: "TESS", href: "https://en.wikipedia.org/wiki/Transiting_Exoplanet_Survey_Satellite" },
      { label: "Cale et al. 2018", href: "https://arxiv.org/abs/1803.04003" },
    ],
  },
  {
    figure: "$5B+",
    line: "in US Genesis Mission commitments name autonomous labs, and private rounds add $900M+.",
    sources: [
      { label: "White House", href: "https://www.whitehouse.gov/releases/2026/07/45502/" },
      { label: "Lila", href: "https://www.lila.ai/news/series-a-235-million" },
      { label: "TechCrunch", href: "https://techcrunch.com/2025/09/30/former-openai-and-deepmind-researchers-raise-whopping-300m-seed-to-automate-science/" },
    ],
  },
];

export const APPLICATIONS: Application[] = [
  {
    domain: "Drug R&D",
    figure: "7.9%",
    line: "of Phase I drugs reach approval",
    icon: Pill,
    sources: [
      { label: "JAMA", href: "https://jamanetwork.com/journals/jama/fullarticle/2762311" },
      { label: "BIO", href: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf" },
    ],
  },
  {
    domain: "ML in science",
    figure: "294",
    line: "papers hit by data leakage",
    icon: Warning,
    sources: [{ label: "Patterns", href: "https://www.cell.com/patterns/fulltext/S2666-3899(23)00159-9" }],
  },
  {
    domain: "Sky surveys",
    figure: "10M",
    line: "Rubin alerts a night",
    icon: ShootingStar,
    sources: [{ label: "Scientific American", href: "https://www.scientificamerican.com/article/rubin-observatory-data-flood-will-let-the-universe-alert-astronomers-10/" }],
  },
  {
    domain: "Exoplanets",
    figure: "100,000+",
    line: "transiting planets expected from Roman",
    icon: Planet,
    sources: [{ label: "NASA", href: "https://science.nasa.gov/universe/exoplanets/roman-telescope-predicted-to-find-100000-transiting-planets/" }],
  },
  {
    domain: "Heart rhythm",
    figure: "700,000",
    line: "Americans with undiagnosed atrial fibrillation",
    icon: Heartbeat,
    sources: [
      { label: "PMC", href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5896911/" },
      { label: "CDC", href: "https://www.cdc.gov/heart-disease/about/atrial-fibrillation.html" },
    ],
  },
  {
    domain: "Gravitational waves",
    figure: "~250",
    line: "signals in the O4 run alone",
    icon: WaveSine,
    sources: [{ label: "Phys.org", href: "https://phys.org/news/2025-11-collaboration-richest-gravitational-date.html" }],
  },
  {
    domain: "Earthquakes",
    figure: "2×",
    line: "more Ridgecrest quakes found by ML",
    icon: Pulse,
    sources: [{ label: "ResearchGate", href: "https://www.researchgate.net/publication/339207449" }],
  },
  {
    domain: "Maintenance",
    figure: "$1.4T",
    line: "a year lost to unplanned downtime",
    icon: Factory,
    sources: [{ label: "Siemens 2024", href: "https://assets.new.siemens.com/siemens/assets/api/uuid:1b43afb5-2d07-47f7-9eb7-893fe7d0bc59/tcod-2024_original.pdf" }],
  },
  {
    domain: "Space weather",
    figure: "20–40M",
    line: "people without power after a Carrington-class storm",
    icon: Sun,
    sources: [{ label: "Lloyd's 2013", href: "https://assets.lloyds.com/assets/pdf-solar-storm-risk-to-the-north-american-electric-grid/1/pdf-Solar-Storm-Risk-to-the-North-American-Electric-Grid.pdf" }],
  },
  {
    domain: "Pharma AI",
    figure: "$60–110B",
    line: "of value a year",
    icon: Flask,
    sources: [{ label: "McKinsey 2024", href: "https://www.mckinsey.com/industries/life-sciences/our-insights/generative-ai-in-the-pharmaceutical-industry-moving-from-hype-to-reality" }],
  },
];
