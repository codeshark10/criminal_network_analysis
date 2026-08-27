import asyncio
import sys
sys.path.append("/Users/amoghagrahari/Documents/PICT hobby projects/crimglass")
from main import upload_case_documents
from fastapi import UploadFile, BackgroundTasks
import os

async def main():
    bg = BackgroundTasks()
    with open("test.txt", "rb") as f:
        file = UploadFile(filename="test.txt", file=f)
        try:
            res = await upload_case_documents(bg, [file], True)
            print("SUCCESS:", res)
        except Exception as e:
            print("ERROR:", repr(e))

asyncio.run(main())
