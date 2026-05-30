import * as cheerio from 'cheerio';
import fs from 'fs';

async function run() {
  const res = await fetch("https://en.wikipedia.org/wiki/2026_FIFA_World_Cup");
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const matches = [];
  $('div.footballbox').each((i, el) => {
    const date = $(el).find('div.fdate').text().trim();
    const time = $(el).find('div.ftime').text().trim();
    const home = $(el).find('th.fhome').text().trim();
    const away = $(el).find('th.faway').text().trim();
    const venue = $(el).find('div[itemprop="location"]').text().trim();
    matches.push({ id: i+1, date, time, home, away, venue });
  });
  console.log(`Found ${matches.length} matches`);
  if (matches.length > 0) {
    console.log(matches.slice(0, 5));
    fs.writeFileSync('matches_wiki.json', JSON.stringify(matches, null, 2));
  }
}
run();
