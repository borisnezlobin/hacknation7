export type Source = { label: string; href: string };
export type Stake = { figure: string; figureNote?: string; line: string; sources: Source[]; lead?: boolean };
export type Application = { figure: string; line: string; sources: Source[] };

export const STAKES: Stake[] = [
  {
    figure: "$28B",
    lead: true,
    line: "of US research a year fails to reproduce. We retest claims blind.",
    sources: [{ label: "Freedman et al. 2015", href: "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1002165" }],
  },
  {
    figure: "6 of 53",
    line: "landmark cancer studies held up on retest. We retest every result.",
    sources: [{ label: "eLife", href: "https://elifesciences.org/articles/67527" }],
  },
  {
    figure: "79,920",
    line: "life-years are saved for each year a cancer drug arrives sooner.",
    sources: [{ label: "Stewart et al. 2018", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5943431/" }],
  },
  {
    figure: "885",
    figureNote: "of 7,931",
    line: "TESS planet candidates are confirmed. Agents can speed up the vetting.",
    sources: [
      { label: "TESS", href: "https://en.wikipedia.org/wiki/Transiting_Exoplanet_Survey_Satellite" },
      { label: "Cale et al. 2018", href: "https://arxiv.org/abs/1803.04003" },
    ],
  },
  {
    figure: "$5B+",
    line: "of US funding backs AI-run science in 2026, and it needs guardrails.",
    sources: [
      { label: "White House", href: "https://www.whitehouse.gov/releases/2026/07/45502/" },
    ],
  },
];

export const APPLICATIONS: Application[] = [
  {
    figure: "7.9%",
    line: "of first-trial drugs win approval. Blind tests drop false leads.",
    sources: [
      { label: "JAMA", href: "https://jamanetwork.com/journals/jama/fullarticle/2762311" },
      { label: "BIO", href: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf" },
    ],
  },
  {
    figure: "294",
    line: "papers broke from leaked test data. Our holdout stays sealed.",
    sources: [{ label: "Patterns", href: "https://www.cell.com/patterns/fulltext/S2666-3899(23)00159-9" }],
  },
  {
    figure: "10M",
    line: "sky changes reach Rubin each night for agents to triage.",
    sources: [{ label: "Scientific American", href: "https://www.scientificamerican.com/article/rubin-observatory-data-flood-will-let-the-universe-alert-astronomers-10/" }],
  },
  {
    figure: "700,000",
    line: "Americans miss an irregular heartbeat hiding in noisy ECG data.",
    sources: [
      { label: "PMC", href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5896911/" },
      { label: "CDC", href: "https://www.cdc.gov/heart-disease/about/atrial-fibrillation.html" },
    ],
  },
  {
    figure: "$1.4T",
    line: "a year goes to breakdowns that vibration data can flag.",
    sources: [{ label: "Siemens 2024", href: "https://assets.new.siemens.com/siemens/assets/api/uuid:1b43afb5-2d07-47f7-9eb7-893fe7d0bc59/tcod-2024_original.pdf" }],
  },
  {
    figure: "20–40M",
    line: "people could lose power unless solar-storm warnings improve.",
    sources: [{ label: "Lloyd's 2013", href: "https://assets.lloyds.com/assets/pdf-solar-storm-risk-to-the-north-american-electric-grid/1/pdf-Solar-Storm-Risk-to-the-North-American-Electric-Grid.pdf" }],
  },
];
