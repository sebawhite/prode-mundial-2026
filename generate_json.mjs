import fs from 'fs';

const TEAMS = {
  // Group A
  "Mexico": "A", "South Africa": "A", "South Korea": "A", "Czech Republic": "A",
  // Group B
  "Canada": "B", "Bosnia and Herzegovina": "B", "Bosnia": "B", "Qatar": "B", "Switzerland": "B",
  // Group C
  "Brazil": "C", "Morocco": "C", "Haiti": "C", "Scotland": "C",
  // Group D
  "United States": "D", "Paraguay": "D", "Australia": "D", "Turkey": "D",
  // Group E
  "Germany": "E", "Curaçao": "E", "Ivory Coast": "E", "Ecuador": "E",
  // Group F
  "Netherlands": "F", "Japan": "F", "Sweden": "F", "Tunisia": "F",
  // Group G
  "Belgium": "G", "Egypt": "G", "Iran": "G", "New Zealand": "G",
  // Group H
  "Spain": "H", "Cape Verde": "H", "Saudi Arabia": "H", "Uruguay": "H",
  // Group I
  "France": "I", "Senegal": "I", "Iraq": "I", "Norway": "I",
  // Group J
  "Argentina": "J", "Algeria": "J", "Austria": "J", "Jordan": "J",
  // Group K
  "Portugal": "K", "DR Congo": "K", "Uzbekistan": "K", "Colombia": "K",
  // Group L
  "England": "L", "Croatia": "L", "Ghana": "L", "Panama": "L"
};

const TEAM_NAMES_ES = {
  "Mexico": "México", "South Africa": "Sudáfrica", "South Korea": "Corea del Sur", "Czech Republic": "Rep. Checa",
  "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia y H.", "Bosnia": "Bosnia y H.", "Qatar": "Qatar", "Switzerland": "Suiza",
  "Brazil": "Brasil", "Morocco": "Marruecos", "Haiti": "Haití", "Scotland": "Escocia",
  "United States": "Estados Unidos", "Paraguay": "Paraguay", "Australia": "Australia", "Turkey": "Turquía",
  "Germany": "Alemania", "Curaçao": "Curazao", "Ivory Coast": "Costa de Marfil", "Ecuador": "Ecuador",
  "Netherlands": "Países Bajos", "Japan": "Japón", "Sweden": "Suecia", "Tunisia": "Túnez",
  "Belgium": "Bélgica", "Egypt": "Egipto", "Iran": "Irán", "New Zealand": "Nueva Zelanda",
  "Spain": "España", "Cape Verde": "Cabo Verde", "Saudi Arabia": "Arabia Saudita", "Uruguay": "Uruguay",
  "France": "Francia", "Senegal": "Senegal", "Iraq": "Irak", "Norway": "Noruega",
  "Argentina": "Argentina", "Algeria": "Argelia", "Austria": "Austria", "Jordan": "Jordania",
  "Portugal": "Portugal", "DR Congo": "RD Congo", "Uzbekistan": "Uzbekistán", "Colombia": "Colombia",
  "England": "Inglaterra", "Croatia": "Croacia", "Ghana": "Ghana", "Panama": "Panamá"
};

function convertToArgentina(dateStr, timeStr) {
  if (!timeStr || timeStr === 'TBD') return { date: dateStr, time: 'TBD' };
  
  const cleanStr = timeStr.replace(/\u00A0/g, ' ').replace('−', '-');
  const match = cleanStr.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.)\s*UTC([-+]\d+)/i);
  if (!match) return { date: dateStr, time: timeStr };

  let [_, hh, mm, ampm, offsetStr] = match;
  let hours = parseInt(hh, 10);
  if (ampm.toLowerCase() === 'p.m.' && hours < 12) hours += 12;
  if (ampm.toLowerCase() === 'a.m.' && hours === 12) hours = 0;
  
  const mmInt = parseInt(mm, 10);
  const offset = parseInt(offsetStr, 10);

  const diff = Math.abs(offset) - 3;
  let totalMin = hours * 60 + mmInt + diff * 60;

  const [yyyy, mo, dd] = dateStr.split('-').map(Number);
  let d = new Date(Date.UTC(yyyy, mo - 1, dd));
  while (totalMin >= 24 * 60) {
    totalMin -= 24 * 60;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  while (totalMin < 0) {
    totalMin += 24 * 60;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  const newHH = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const newMM = String(totalMin % 60).padStart(2, '0');
  const newDate = d.toISOString().slice(0, 10);
  
  return { date: newDate, time: `${newHH}:${newMM} ART` };
}

const raw = JSON.parse(fs.readFileSync('matches_wiki.json', 'utf8'));

const matches = [];

for (let i = 0; i < 72; i++) {
  const r = raw[i];
  
  const m = r.date.match(/\((2026-\d{2}-\d{2})\)/);
  const dateIso = m ? m[1] : 'TBD';
  
  let group = TEAMS[r.home] || "Unknown";
  let matchday = 1;
  if (i >= 24 && i < 48) matchday = 2;
  if (i >= 48) matchday = 3;
  
  const converted = convertToArgentina(dateIso, r.time);

  matches.push({
    round: `Matchday ${matchday}`,
    date: converted.date,
    time: converted.time,
    team1: TEAM_NAMES_ES[r.home] || r.home,
    team2: TEAM_NAMES_ES[r.away] || r.away,
    group: `Group ${group}`,
    ground: r.venue
  });
}

const finalOutput = {
  name: "World Cup 2026",
  matches
};

fs.writeFileSync('public/worldcup.json', JSON.stringify(finalOutput, null, 2));
console.log(`Generated public/worldcup.json in ART with ${matches.length} matches.`);
