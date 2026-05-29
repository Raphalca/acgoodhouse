import json, glob

projects = []
for f in glob.glob('data/projects/*.json'):
    with open(f, encoding='utf-8') as fp:
        projects.append(json.load(fp))

projects.sort(key=lambda p: p.get('postedDate', ''), reverse=True)

with open('data/projects.json', 'w', encoding='utf-8') as fp:
    json.dump({'projects': projects}, fp, ensure_ascii=False, indent=2)

print(f'Built {len(projects)} projects into data/projects.json')
