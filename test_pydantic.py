from pydantic import BaseModel
from typing import List
class FileUploadResult(BaseModel):
    filename: str
    status: str
    file_path: str
    size_bytes: int

class UploadCasesResponse(BaseModel):
    message: str
    total_uploaded: int
    files: List[FileUploadResult]
    pipeline_status: str

try:
    UploadCasesResponse(
        case_id="123",
        message="ok",
        total_uploaded=1,
        files=[],
        pipeline_status="Idle"
    )
    print("SUCCESS")
except Exception as e:
    print(repr(e))
