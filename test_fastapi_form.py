from fastapi import FastAPI, File, UploadFile
from fastapi.testclient import TestClient

app = FastAPI()

@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)):
    return {"files": [f.filename for f in files]}

client = TestClient(app)
res = client.post("/upload", data={"case_id": "123"}, files=[("files", ("test.txt", b"hello"))])
print(res.status_code, res.text)
