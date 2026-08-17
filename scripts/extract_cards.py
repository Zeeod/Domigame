
import os
import re
import json

base_path = r'd:\Jeux\Developpement\dominion\shared\cards'
results = []

def extract_cards_from_content(content, rel_path):
    # Regex to find export const X: CardDefinition = { ... }
    # We'll look for name, id, and expansion/set
    
    # Split content if there are multiple cards in one file (e.g. events.ts)
    card_blocks = re.split(r'export const \w+: CardDefinition =', content)
    if len(card_blocks) <= 1:
        # Maybe it's not exported as a const or named differently
        # Try to find object literals that look like CardDefinition
        card_blocks = [content]

    for block in card_blocks:
        if 'id:' not in block or 'name:' not in block:
            continue
            
        id_match = re.search(r'id:\s*[\'"`](.*?)[\'"`]', block)
        name_match = re.search(r'name:\s*[\'"`](.*?)[\'"`]', block)
        expansion_match = re.search(r'expansion:\s*[\'"`](.*?)[\'"`]', block)
        set_match = re.search(r'set:\s*[\'"`](.*?)[\'"`]', block)
        
        if id_match and name_match:
            results.append({
                'id': id_match.group(1),
                'name': name_match.group(1),
                'expansion': expansion_match.group(1) if expansion_match else (set_match.group(1) if set_match else 'N/A'),
                'file': rel_path
            })

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.ts') and file != 'index.ts':
            rel_path = os.path.relpath(os.path.join(root, file), base_path)
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                extract_cards_from_content(content, rel_path)

print(json.dumps(results, indent=2))
