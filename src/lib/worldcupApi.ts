import { Team, Match, TEAMS, ALL_MATCHES } from '../data/seedData';

// Standard mapping of English team names to our local codes
const NORM_MAP: Record<string, string> = {
  "mexico": "MEX", "méxico": "MEX",
  "south africa": "RSA", "sudáfrica": "RSA",
  "south korea": "KOR", "korea republic": "KOR", "korea": "KOR", "corea del sur": "KOR",
  "czech republic": "CZE", "czechia": "CZE", "rep checa": "CZE", "rep. checa": "CZE",
  "canada": "CAN", "canadá": "CAN",
  "bosnia and herzegovina": "BIH", "bosnia & herzegovina": "BIH", "bosnia": "BIH", "bosnia y h.": "BIH", "bih": "BIH",
  "qatar": "QAT",
  "switzerland": "SUI", "suiza": "SUI",
  "brazil": "BRA", "brasil": "BRA",
  "morocco": "MAR", "marruecos": "MAR",
  "haiti": "HAI", "haití": "HAI",
  "scotland": "SCO", "escocia": "SCO",
  "united states": "USA", "usa": "USA", "us": "USA", "estados unidos": "USA",
  "paraguay": "PAR",
  "australia": "AUS",
  "turkey": "TUR", "türkiye": "TUR", "turquía": "TUR",
  "germany": "GER", "alemania": "GER",
  "curacao": "CUW", "curaçao": "CUW", "curazao": "CUW",
  "ivory coast": "CIV", "cote d'ivoire": "CIV", "côte d'ivoire": "CIV", "costa de marfil": "CIV",
  "ecuador": "ECU",
  "netherlands": "NED", "países bajos": "NED", "paises bajos": "NED",
  "japan": "JPN", "jápón": "JPN", "japon": "JPN",
  "sweden": "SWE", "suecia": "SWE",
  "tunisia": "TUN", "túnez": "TUN", "tunez": "TUN",
  "belgium": "BEL", "bélgica": "BEL",
  "egypt": "EGY", "egipto": "EGY",
  "iran": "IRN", "irán": "IRN",
  "new zealand": "NZL", "nueva zelanda": "NZL",
  "spain": "ESP", "españa": "ESP",
  "cape verde": "CPV", "cabo verde": "CPV",
  "saudi arabia": "KSA", "arabia saudita": "KSA",
  "uruguay": "URU",
  "france": "FRA", "francia": "FRA",
  "senegal": "SEN",
  "iraq": "IRQ", "irak": "IRQ",
  "norway": "NOR", "noruega": "NOR",
  "argentina": "ARG",
  "algeria": "ALG", "argelia": "ALG",
  "austria": "AUT",
  "jordan": "JOR", "jordania": "JOR",
  "portugal": "POR",
  "dr congo": "COD", "congo dr": "COD", "democratic republic of the congo": "COD", "congo": "COD", "rd congo": "COD",
  "uzbekistan": "UZB", "uzbekistán": "UZB",
  "colombia": "COL",
  "england": "ENG", "inglaterra": "ENG",
  "croatia": "CRO", "croacia": "CRO",
  "ghana": "GHA",
  "panama": "PAN", "panamá": "PAN"
};

// Find team from local TEAMS register or generate high quality fallback
export function findTeamByNameOrCode(nameOrCode: string): Team {
  const cleaned = nameOrCode.trim().toLowerCase();
  
  // 1. Direct upper code check has highest priority
  const upperCode = cleaned.toUpperCase();
  if (TEAMS[upperCode]) {
    return TEAMS[upperCode];
  }
  
  // 2. Norman mapping lookup
  const codeFromMap = NORM_MAP[cleaned];
  if (codeFromMap && TEAMS[codeFromMap]) {
    return TEAMS[codeFromMap];
  }
  
  // 3. Search for best match in name contains
  const foundTeam = Object.values(TEAMS).find(t => {
    const localName = t.name.toLowerCase();
    const localCode = t.code.toLowerCase();
    return (
      localName === cleaned ||
      localCode === cleaned ||
      localName.includes(cleaned) ||
      cleaned.includes(localName)
    );
  });
  
  if (foundTeam) {
    return foundTeam;
  }
  
  // 4. Default dynamic fallback
  return {
    code: nameOrCode.substring(0, 3).toUpperCase(),
    name: nameOrCode,
    flag: "🏳️",
    placeholder: true
  };
}

// Map real-time date string safely to ISO string
function parseMatchDate(dateStr: string, timeStr?: string): string {
  try {
    if (timeStr) {
      // Remove "UTC" prefix mapping to keep JavaScript's date parser clean
      const timeClean = timeStr.replace(/UTC/i, "").trim();
      const combined = `${dateStr}T${timeClean}`;
      const d = new Date(combined);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    const fallbackD = new Date(dateStr);
    if (!isNaN(fallbackD.getTime())) {
      return fallbackD.toISOString();
    }
  } catch (e) {
    console.warn("Could not parse match date: ", dateStr, timeStr);
  }
  return new Date("2026-06-11T12:00:00Z").toISOString();
}

/**
 * Fetch and map match list from openfootball Public API
 */
export async function fetchWorldCup2026Matches(): Promise<Match[]> {
  const url = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load world cup data: ${res.statusText}`);
  }
  
  const data = await res.json();
  if (!data || !Array.isArray(data.matches)) {
    throw new Error("Invalid json format: 'matches' is missing or not an array");
  }

  // Map each json match object into the correct stable Match format
  const mappedMatches: Match[] = data.matches.map((item: any, index: number) => {
    const homeTeam = findTeamByNameOrCode(item.team1);
    const awayTeam = findTeamByNameOrCode(item.team2);
    
    // Parse the group name
    let groupLetter: string | undefined = undefined;
    if (item.group) {
      const match = item.group.match(/Group\s+([A-L])/i);
      if (match) {
        groupLetter = match[1];
      } else {
        const simpleMatch = item.group.match(/([A-L])/i);
        groupLetter = simpleMatch ? simpleMatch[1].toUpperCase() : undefined;
      }
    }
    
    // Parse matchday (round) e.g. "Matchday 1"
    let matchday = 1;
    if (item.round) {
      const mdayMatch = item.round.match(/Matchday\s+(\d+)/i);
      if (mdayMatch) {
         matchday = parseInt(mdayMatch[1], 10);
      }
    }

    // Capture standard final scores if they exist
    const hasScore = item.score && Array.isArray(item.score.ft);
    const homeScore = hasScore ? item.score.ft[0] : null;
    const awayScore = hasScore ? item.score.ft[1] : null;

    // Build standard structure matching seedData
    const parsedMatch: Match = {
      id: `match-api-${index + 1}`, // Temporary fallback ID
      stage: "groups",
      group: groupLetter,
      matchday,
      date: parseMatchDate(item.date, item.time),
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      isFinished: hasScore,
      venue: item.ground || "TBD Stadium"
    };

    return parsedMatch;
  });

  // Filter only Group Stage matches (where m.group is defined) so that knockouts/playoffs are not included
  const groupStageMapped = mappedMatches.filter(m => m.group !== undefined);

  // Align IDs with local ALL_MATCHES to keep predictions connected
  const finalizedMatches = groupStageMapped.map(apiMatch => {
    // Try to find the matching game in local predefined ALL_MATCHES list
    const alignedLocal = ALL_MATCHES.find(local => {
      const sameTeams = 
        (local.homeTeam.code === apiMatch.homeTeam.code && local.awayTeam.code === apiMatch.awayTeam.code) ||
        (local.homeTeam.code === apiMatch.awayTeam.code && local.awayTeam.code === apiMatch.homeTeam.code);
      return sameTeams && local.group === apiMatch.group && local.matchday === apiMatch.matchday;
    });

    if (alignedLocal) {
      return {
        ...apiMatch,
        id: alignedLocal.id // High priority: maintain predefined identifier to avoid breaking local predictions
      };
    }
    
    return apiMatch;
  });

  return finalizedMatches;
}
