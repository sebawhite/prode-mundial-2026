import worldcupData from '../../public/worldcup.json';

export interface Team {
  code: string;
  name: string;
  flag: string;
  placeholder?: boolean;
}

export interface Match {
  id: string; // "match-1" to "match-104"
  stage: "groups" | "16avos" | "8vos" | "cuartos" | "semis" | "third_place" | "final";
  group?: string; // "A" - "L"
  matchday?: number; // 1, 2, 3
  date: string; // ISO String
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  venue: string;
}

export interface Player {
  id: string;
  name: string;
  team: string; // ARG, FRA, etc.
  position: "GK" | "DF" | "MF" | "FW";
}

export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: { code: "MEX", name: "México", flag: "🇲🇽" },
  RSA: { code: "RSA", name: "Sudáfrica", flag: "🇿🇦" },
  KOR: { code: "KOR", name: "Corea del Sur", flag: "🇰🇷" },
  CZE: { code: "CZE", name: "Rep. Checa", flag: "🇨🇿" },
  // Group B
  CAN: { code: "CAN", name: "Canadá", flag: "🇨🇦" },
  BIH: { code: "BIH", name: "Bosnia y H.", flag: "🇧🇦" },
  QAT: { code: "QAT", name: "Qatar", flag: "🇶🇦" },
  SUI: { code: "SUI", name: "Suiza", flag: "🇨🇭" },
  // Group C
  BRA: { code: "BRA", name: "Brasil", flag: "🇧🇷" },
  MAR: { code: "MAR", name: "Marruecos", flag: "🇲🇦" },
  HAI: { code: "HAI", name: "Haití", flag: "🇭🇹" },
  SCO: { code: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  USA: { code: "USA", name: "Estados Unidos", flag: "🇺🇸" },
  PAR: { code: "PAR", name: "Paraguay", flag: "🇵🇾" },
  AUS: { code: "AUS", name: "Australia", flag: "🇦🇺" },
  TUR: { code: "TUR", name: "Turquía", flag: "🇹🇷" },
  // Group E
  GER: { code: "GER", name: "Alemania", flag: "🇩🇪" },
  CUW: { code: "CUW", name: "Curazao", flag: "🇨🇼" },
  CIV: { code: "CIV", name: "Costa de Marfil", flag: "🇨🇮" },
  ECU: { code: "ECU", name: "Ecuador", flag: "🇪🇨" },
  // Group F
  NED: { code: "NED", name: "Países Bajos", flag: "🇳🇱" },
  JPN: { code: "JPN", name: "Japón", flag: "🇯🇵" },
  SWE: { code: "SWE", name: "Suecia", flag: "🇸🇪" },
  TUN: { code: "TUN", name: "Túnez", flag: "🇹🇳" },
  // Group G
  BEL: { code: "BEL", name: "Bélgica", flag: "🇧🇪" },
  EGY: { code: "EGY", name: "Egipto", flag: "🇪🇬" },
  IRN: { code: "IRN", name: "Irán", flag: "🇮🇷" },
  NZL: { code: "NZL", name: "Nueva Zelanda", flag: "🇳🇿" },
  // Group H
  ESP: { code: "ESP", name: "España", flag: "🇪🇸" },
  CPV: { code: "CPV", name: "Cabo Verde", flag: "🇨🇻" },
  KSA: { code: "KSA", name: "Arabia Saudita", flag: "🇸🇦" },
  URU: { code: "URU", name: "Uruguay", flag: "🇺🇾" },
  // Group I
  FRA: { code: "FRA", name: "Francia", flag: "🇫🇷" },
  SEN: { code: "SEN", name: "Senegal", flag: "🇸🇳" },
  IRQ: { code: "IRQ", name: "Irak", flag: "🇮🇶" },
  NOR: { code: "NOR", name: "Noruega", flag: "🇳🇴" },
  // Group J
  ARG: { code: "ARG", name: "Argentina", flag: "🇦🇷" },
  ALG: { code: "ALG", name: "Argelia", flag: "🇩🇿" },
  AUT: { code: "AUT", name: "Austria", flag: "🇦🇹" },
  JOR: { code: "JOR", name: "Jordania", flag: "🇯🇴" },
  // Group K
  POR: { code: "POR", name: "Portugal", flag: "🇵🇹" },
  COD: { code: "COD", name: "RD Congo", flag: "🇨🇩" },
  UZB: { code: "UZB", name: "Uzbekistán", flag: "🇺🇿" },
  COL: { code: "COL", name: "Colombia", flag: "🇨🇴" },
  // Group L
  ENG: { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  CRO: { code: "CRO", name: "Croacia", flag: "🇭🇷" },
  GHA: { code: "GHA", name: "Ghana", flag: "🇬🇭" },
  PAN: { code: "PAN", name: "Panamá", flag: "🇵🇦" }
};

export const GROUPS: Record<string, string[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"]
};

// Helper lookup functions for mapping worldcup.json
const findTeamByName = (name: string): Team => {
  const cleaned = name.trim().toLowerCase();
  const found = Object.values(TEAMS).find(t => t.name.toLowerCase() === cleaned);
  if (found) return found;
  
  // Custom checks for team names that might differ slightly:
  if (cleaned.includes("bosnia")) return TEAMS.BIH;
  if (cleaned.includes("marfil")) return TEAMS.CIV;
  if (cleaned.includes("congo")) return TEAMS.COD;
  if (cleaned.includes("estados unidos") || cleaned === "usa") return TEAMS.USA;
  if (cleaned.includes("curazao") || cleaned.includes("curacao")) return TEAMS.CUW;
  if (cleaned.includes("países bajos") || cleaned.includes("paises bajos") || cleaned === "netherlands") return TEAMS.NED;
  if (cleaned.includes("arabia")) return TEAMS.KSA;
  if (cleaned.includes("zelanda")) return TEAMS.NZL;
  if (cleaned.includes("checa")) return TEAMS.CZE;
  if (cleaned.includes("cabo verde")) return TEAMS.CPV;
  if (cleaned.includes("corea")) return TEAMS.KOR;
  if (cleaned.includes("sudáfrica")) return TEAMS.RSA;
  
  return {
    code: name.substring(0, 3).toUpperCase(),
    name,
    flag: "🏳️",
    placeholder: true
  };
};

function parseMatchDate(dateStr: string, timeStr?: string): string {
  try {
    if (timeStr && timeStr !== "TBD" && !timeStr.includes("TBD")) {
      // Check if it's in the new ART format: "16:00 ART"
      const artMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s+ART$/i);
      if (artMatch) {
        const hh = artMatch[1].padStart(2, '0');
        const mm = artMatch[2];
        const combined = `${dateStr}T${hh}:${mm}:00-03:00`;
        const d = new Date(combined);
        // Retornamos el string con el offset explícito en lugar de usar toISOString() que fuerza la 'Z'
        if (!isNaN(d.getTime())) return combined;
      }

      // Legacy UTC logic
      const timeClean = timeStr.replace(/UTC/i, "").trim();
      const combined = `${dateStr}T${timeClean}`;
      const d = new Date(combined);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    // If no valid time, default to 12:00 PM UTC for that date
    const combinedFallback = `${dateStr}T12:00:00Z`;
    const fallbackD = new Date(combinedFallback);
    if (!isNaN(fallbackD.getTime())) {
      return fallbackD.toISOString();
    }
  } catch (e) {
    // Fallback
  }
  return new Date("2026-06-11T12:00:00Z").toISOString();
}

// Generate Group stage matches from official public/worldcup.json
export const generateGroupMatches = (): Match[] => {
  const matches: Match[] = [];
  
  // Filter only matches that belong to a group stage (Group A to L)
  const groupMatchesData = worldcupData.matches.filter((item: any) => {
    return item.group && /Group/i.test(item.group);
  });
  
  groupMatchesData.forEach((item: any, idx: number) => {
    const matchId = `match-${idx + 1}`;
    
    // Parse Group Letter (e.g. "Group A" -> "A")
    let groupLetter = "A";
    if (item.group) {
      const groupMatch = item.group.match(/Group\s+([A-L])/i);
      if (groupMatch) {
        groupLetter = groupMatch[1];
      }
    }
    
    // Parse Matchday
    let matchday = 1;
    if (item.round) {
      const mdayMatch = item.round.match(/Matchday\s+(\d+)/i);
      if (mdayMatch) {
        matchday = parseInt(mdayMatch[1], 10);
      }
    }
    
    const homeTeam = findTeamByName(item.team1);
    const awayTeam = findTeamByName(item.team2);
    
    matches.push({
      id: matchId,
      stage: "groups",
      group: groupLetter,
      matchday: matchday,
      date: parseMatchDate(item.date, item.time),
      homeTeam,
      awayTeam,
      homeScore: null,
      awayScore: null,
      isFinished: false,
      venue: item.ground || "Estadio Mundial 2026"
    });
  });
  
  return matches;
};

// 32 Knockout Matches: 16avos (16), 8vos (8), cuartos (4), semis (2), 3er puesto (1), final (1)
// Total 104 matches
export const generateKnockoutMatches = (): Match[] => {
  const matches: Match[] = [];
  let idCounter = 73;

  // Helper to build a slot
  const createNKM = (
    stage: Match["stage"],
    hName: string,
    hCode: string,
    aName: string,
    aCode: string,
    daysOffset: number,
    venue: string
  ): Match => {
    // 28 de junio de 2026, por defecto le ponemos las 16:00 ART
    const baseDate = new Date("2026-06-28T00:00:00Z");
    baseDate.setDate(baseDate.getDate() + daysOffset);
    const dateStr = baseDate.toISOString().slice(0, 10);
    const explicitDate = `${dateStr}T16:00:00-03:00`;
    
    return {
      id: `match-${idCounter++}`,
      stage,
      date: explicitDate,
      homeTeam: { code: hCode, name: hName, flag: "🏳️", placeholder: true },
      awayTeam: { code: aCode, name: aName, flag: "🏳️", placeholder: true },
      homeScore: null,
      awayScore: null,
      isFinished: false,
      venue
    };
  };

  // 16avos: match 73 to 88 (June 28 to July 1)
  const round32 = [
    { h: "1° Grupo A", hc: "1A", a: "2° Grupo B", ac: "2B", d: 0, v: "MetLife, NY" },
    { h: "1° Grupo C", hc: "1C", a: "3° Gpe A/B/F", ac: "3ABF", d: 0, v: "SoFi, LA" },
    { h: "1° Grupo B", hc: "1B", a: "2° Grupo A", ac: "2A", d: 1, v: "Hard Rock, Miami" },
    { h: "1° Grupo D", hc: "1D", a: "3° Gpe B/C/H", ac: "3BCH", d: 1, v: "AT&T, Dallas" },
    { h: "1° Grupo E", hc: "1E", a: "2° Grupo F", ac: "2F", d: 2, v: "Gillette, Boston" },
    { h: "1° Grupo G", hc: "1G", a: "2° Grupo H", ac: "2H", d: 2, v: "Arrowhead, KC" },
    { h: "1° Grupo F", hc: "1F", a: "2° Grupo E", ac: "2E", d: 2, v: "NRG, Houston" },
    { h: "1° Grupo H", hc: "1H", a: "2° Grupo G", ac: "2G", d: 3, v: "Akron, Guadalajara" },
    { h: "1° Grupo I", hc: "1I", a: "2° Grupo J", ac: "2J", d: 3, v: "SoFi, LA" },
    { h: "1° Grupo K", hc: "1K", a: "3° Gpe I/J/L", ac: "3IJL", d: 4, v: "MetLife, NY" },
    { h: "1° Grupo J", hc: "1J", a: "2° Grupo I", ac: "2I", d: 4, v: "BC Place, Vancouver" },
    { h: "1° Grupo L", hc: "1L", a: "3° Gpe G/H/K", ac: "3GHK", d: 4, v: "Lincoln Financial, Philly" },
    { h: "2° Grupo C", hc: "2C", a: "2° Grupo D", ac: "2D", d: 5, v: "Arrowhead, KC" },
    { h: "2° Grupo K", hc: "2K", a: "2° Grupo L", ac: "2L", d: 5, v: "Gillette, Boston" },
    { h: "1° Grupo A", hc: "1A", a: "3° Gpe C/D/E", ac: "3CDE", d: 6, v: "Azteca, CDMX" },
    { h: "2° Grupo G", hc: "2G", a: "2° Grupo H", ac: "2H", d: 6, v: "BBVA, Monterrey" }
  ];
  round32.forEach(r => matches.push(createNKM("16avos", r.h, r.hc, r.a, r.ac, r.d, r.v)));

  // 8vos: match 89 to 96 (July 4 to July 7)
  const round16 = [
    { h: "Ganador M73", hc: "W73", a: "Ganador M74", ac: "W74", d: 8, v: "MetLife, NY" },
    { h: "Ganador M75", hc: "W75", a: "Ganador M76", ac: "W76", d: 8, v: "Hard Rock, Miami" },
    { h: "Ganador M77", hc: "W77", a: "Ganador M78", ac: "W78", d: 9, v: "Gillette, Boston" },
    { h: "Ganador M79", hc: "W79", a: "Ganador M80", ac: "W80", d: 9, v: "SoFi, LA" },
    { h: "Ganador M81", hc: "W81", a: "Ganador M82", ac: "W82", d: 10, v: "Lincoln Financial, Philly" },
    { h: "Ganador M83", hc: "W83", a: "Ganador M84", ac: "W84", d: 10, v: "BC Place, Vancouver" },
    { h: "Ganador M85", hc: "W85", a: "Ganador M86", ac: "W86", d: 11, v: "Azteca, CDMX" },
    { h: "Ganador M87", hc: "W87", a: "Ganador M88", ac: "W88", d: 11, v: "Arrowhead, KC" }
  ];
  round16.forEach(r => matches.push(createNKM("8vos", r.h, r.hc, r.a, r.ac, r.d, r.v)));

  // Cuartos: match 97 to 100 (July 9 to July 11)
  const round8 = [
    { h: "Ganador M89", hc: "W89", a: "Ganador M90", ac: "W90", d: 13, v: "SoFi, LA" },
    { h: "Ganador M91", hc: "W91", a: "Ganador M92", ac: "W92", d: 13, v: "AT&T, Dallas" },
    { h: "Ganador M93", hc: "W93", a: "Ganador M94", ac: "W94", d: 14, v: "Gillette, Boston" },
    { h: "Ganador M95", hc: "W95", a: "Ganador M96", ac: "W96", d: 14, v: "MetLife, NY" }
  ];
  round8.forEach(r => matches.push(createNKM("cuartos", r.h, r.hc, r.a, r.ac, r.d, r.v)));

  // Semis: match 101 to 102 (July 14 & July 15)
  const round4 = [
    { h: "Ganador M97", hc: "W97", a: "Ganador M98", ac: "W98", d: 18, v: "Mercedes-Benz, Atlanta" },
    { h: "Ganador M99", hc: "W99", a: "Ganador M100", ac: "W100", d: 19, v: "Hard Rock, Miami" }
  ];
  round4.forEach(r => matches.push(createNKM("semis", r.h, r.hc, r.a, r.ac, r.d, r.v)));

  // Tercer Puesto: match 103 (July 18)
  matches.push(createNKM("third_place", "Perdedor M101", "L101", "Perdedor M102", "L102", 22, "Hard Rock, Miami"));

  // Final: match 104 (July 19)
  matches.push(createNKM("final", "Ganador M101", "W101", "Ganador M102", "W102", 23, "MetLife Stadium, NY"));

  return matches;
};

export const ALL_MATCHES = generateGroupMatches();

export const TOP_PLAYERS: Player[] = [
  // Argentina
  { id: "lm10", name: "Lionel Messi", team: "ARG", position: "FW" },
  { id: "la22", name: "Lautaro Martínez", team: "ARG", position: "FW" },
  { id: "ja19", name: "Julián Álvarez", team: "ARG", position: "FW" },
  { id: "ed23", name: "Emiliano Martínez", team: "ARG", position: "GK" },
  { id: "ea10", name: "Enzo Fernández", team: "ARG", position: "MF" },
  { id: "am10", name: "Alexis Mac Allister", team: "ARG", position: "MF" },
  
  // France
  { id: "km10", name: "Kylian Mbappé", team: "FRA", position: "FW" },
  { id: "ag07", name: "Antoine Griezmann", team: "FRA", position: "MF" },
  { id: "od11", name: "Ousmane Dembélé", team: "FRA", position: "FW" },
  { id: "oc10", name: "Eduardo Camavinga", team: "FRA", position: "MF" },
  { id: "at08", name: "Aurélien Tchouaméni", team: "FRA", position: "MF" },
  { id: "mo16", name: "Mike Maignan", team: "FRA", position: "GK" },

  // Brasil
  { id: "vj07", name: "Vinícius Júnior", team: "BRA", position: "FW" },
  { id: "r10", name: "Rodrygo", team: "BRA", position: "FW" },
  { id: "n10", name: "Neymar Jr", team: "BRA", position: "FW" },
  { id: "g08", name: "Bruno Guimarães", team: "BRA", position: "MF" },
  { id: "p09", name: "Lucas Paquetá", team: "BRA", position: "MF" },
  { id: "a11", name: "Alisson Becker", team: "BRA", position: "GK" },

  // England
  { id: "hk09", name: "Harry Kane", team: "ENG", position: "FW" },
  { id: "jb10", name: "Jude Bellingham", team: "ENG", position: "MF" },
  { id: "bs07", name: "Bukayo Saka", team: "ENG", position: "FW" },
  { id: "pf11", name: "Phil Foden", team: "ENG", position: "MF" },
  { id: "dr04", name: "Declan Rice", team: "ENG", position: "MF" },
  { id: "jp01", name: "Jordan Pickford", team: "ENG", position: "GK" },

  // Spain
  { id: "ly19", name: "Lamine Yamal", team: "ESP", position: "FW" },
  { id: "nw17", name: "Nico Williams", team: "ESP", position: "FW" },
  { id: "r16", name: "Rodri", team: "ESP", position: "MF" },
  { id: "pd20", name: "Pedri", team: "ESP", position: "MF" },
  { id: "g09", name: "Gavi", team: "ESP", position: "MF" },
  { id: "us01", name: "Unai Simón", team: "ESP", position: "GK" },

  // Portugal
  { id: "cr07", name: "Cristiano Ronaldo", team: "POR", position: "FW" },
  { id: "bf10", name: "Bruno Fernandes", team: "POR", position: "MF" },
  { id: "bl10", name: "Bernardo Silva", team: "POR", position: "MF" },
  { id: "rl09", name: "Rafael Leão", team: "POR", position: "FW" },
  { id: "j01", name: "Diogo Costa", team: "POR", position: "GK" },

  // Uruguay
  { id: "fd15", name: "Federico Valverde", team: "URU", position: "MF" },
  { id: "dn09", name: "Darwin Núñez", team: "URU", position: "FW" },
  { id: "la11", name: "Luis Suárez", team: "URU", position: "FW" },
  { id: "rg04", name: "Ronald Araújo", team: "URU", position: "DF" },

  // Germany
  { id: "jm10", name: "Jamal Musiala", team: "GER", position: "MF" },
  { id: "fw10", name: "Florian Wirtz", team: "GER", position: "MF" },
  { id: "kg08", name: "Kai Havertz", team: "GER", position: "FW" },
  { id: "mat01", name: "Marc-André ter Stegen", team: "GER", position: "GK" },

  // Colombia
  { id: "jr10", name: "James Rodríguez", team: "COL", position: "MF" },
  { id: "ld07", name: "Luis Díaz", team: "COL", position: "FW" },

  // Mexico
  { id: "sg11", name: "Santiago Giménez", team: "MEX", position: "FW" },
  { id: "co10", name: "César Montes", team: "MEX", position: "DF" },

  // Canada
  { id: "ad19", name: "Alphonso Davies", team: "CAN", position: "DF" },
  { id: "jd09", name: "Jonathan David", team: "CAN", position: "FW" }
];

export const INITIAL_CONFIG = {
  groupStageDeadline: "2026-06-11T19:00:00Z",
  knockoutDeadline: "2026-06-27T23:59:00Z",
  buyInAmount: 6000,
  currency: "ARS",
  paymentAlias: "felix.prode",
  prizeDistribution: { first: 0.60, second: 0.25, third: 0.15 },
  poolPercent: 0.50,
  inviteCodes: ["YELCHO2026-A8F3K2", "YELCHO2026-XYZ", "YELCHO2026-PRODE", "YELCHO2026-MUNDIAL"]
};
