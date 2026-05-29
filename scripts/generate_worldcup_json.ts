import fs from 'fs';
import path from 'path';
import { generateGroupMatches, generateKnockoutMatches } from '../src/data/seedData';

function generateWorldCupJson() {
  console.log("Generating complete and clean World Cup 2026 JSON...");

  // Combine group and knockout matches to create a fully complete fixture
  const groupMatches = generateGroupMatches();
  const knockoutMatches = generateKnockoutMatches();
  const allMatches = [...groupMatches, ...knockoutMatches];

  const matchesMapped = allMatches.map((m, index) => {
    // Determine the round/matchday label
    let round = `Matchday ${m.matchday || 1}`;
    if (m.stage !== 'groups') {
      round = m.stage === '16avos' ? 'Round of 32' :
              m.stage === '8vos' ? 'Round of 16' :
              m.stage === 'cuartos' ? 'Quarter-finals' :
              m.stage === 'semis' ? 'Semi-finals' :
              m.stage === 'third_place' ? 'Match for third place' : 'Final';
    }

    // Format date and time
    const d = new Date(m.date);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toISOString().split('T')[1].substring(0, 5) + " UTC";

    return {
      round,
      date: dateStr,
      time: timeStr,
      team1: m.homeTeam.name,
      team2: m.awayTeam.name,
      group: m.group ? `Group ${m.group}` : undefined,
      ground: m.venue
    };
  });

  const outputData = {
    name: "World Cup 2026",
    matches: matchesMapped
  };

  const outputPath = path.join(process.cwd(), 'public/worldcup.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`Successfully wrote clean World Cup JSON with ${matchesMapped.length} matches to: ${outputPath}`);
}

generateWorldCupJson();
