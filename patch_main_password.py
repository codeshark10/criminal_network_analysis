import re

with open('main.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "crick#21")', 'NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "cricket@123")')

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Backend API Updated with correct password.")
