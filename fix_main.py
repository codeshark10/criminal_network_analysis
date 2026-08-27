import re

with open("/Users/amoghagrahari/Documents/PICT hobby projects/crimglass/main.py", "r") as f:
    content = f.read()

# Fix the Cypher query
content = content.replace("SET d:Document // Apply Document label for metrics counting\n    ON CREATE SET", "ON CREATE SET")
content = content.replace("d.uploaded_at = datetime()", "d.uploaded_at = datetime()\n    SET d:Document")

# Fix UploadCasesResponse missing case_id
# We previously removed case_id from return, but the schema also lacks it, so it's fine.

with open("/Users/amoghagrahari/Documents/PICT hobby projects/crimglass/main.py", "w") as f:
    f.write(content)
