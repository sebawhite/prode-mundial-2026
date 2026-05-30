import urllib.request
from bs4 import BeautifulSoup
import json

url = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')

# Find match tables
matches = []
for div in soup.find_all('div', class_='footballbox'):
    date_el = div.find('div', class_='fdate')
    time_el = div.find('div', class_='ftime')
    team1_el = div.find('th', class_='fhome')
    team2_el = div.find('th', class_='faway')
    stadium_el = div.find('div', itemprop='location')
    
    date = date_el.text.strip() if date_el else 'TBD'
    time = time_el.text.strip() if time_el else 'TBD'
    team1 = team1_el.text.strip() if team1_el else 'TBD'
    team2 = team2_el.text.strip() if team2_el else 'TBD'
    stadium = stadium_el.text.strip() if stadium_el else 'TBD'
    
    matches.append({
        'date': date,
        'time': time,
        'team1': team1,
        'team2': team2,
        'stadium': stadium
    })

print(f"Found {len(matches)} matches")
if len(matches) > 0:
    print(matches[:5])
