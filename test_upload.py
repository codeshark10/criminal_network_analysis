import requests

url = "http://localhost:8000/api/cases/upload"
files = {'files': ('test.txt', 'This is a test document.')}
response = requests.post(url, files=files)
print(response.json())
