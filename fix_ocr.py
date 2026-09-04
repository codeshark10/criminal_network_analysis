import os

with open('pdf_processor.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
'''import os
import hashlib
from datetime import datetime, timezone
from io import BytesIO
from pdf2image import convert_from_path
import Vision
import Quartz''',
'''import os
import hashlib
import platform
from datetime import datetime, timezone
from io import BytesIO

# Platform-specific imports for Apple Native OCR
IS_MAC = platform.system() == 'Darwin'
if IS_MAC:
    from pdf2image import convert_from_path
    import Vision
    import Quartz''')

content = content.replace(
'''def apple_neural_ocr_image(image_bytes: bytes) -> str:
    """
    Executes lightning-fast OCR using Apple's Native Vision Framework
    directly on the Apple Silicon Neural Engine (~0.1s per page)[cite: 1].
    """
    data = Quartz.NSData.dataWithBytes_length_(image_bytes, len(image_bytes))''',
'''def apple_neural_ocr_image(image_bytes: bytes) -> str:
    """
    Executes lightning-fast OCR using Apple's Native Vision Framework
    directly on the Apple Silicon Neural Engine (~0.1s per page)[cite: 1].
    """
    if not IS_MAC:
        return "[MOCKED OCR CONTENT: Apple Vision Framework not available on Windows]"

    data = Quartz.NSData.dataWithBytes_length_(image_bytes, len(image_bytes))''')

content = content.replace(
'''        if filename.lower().endswith(".pdf"):
            images = convert_from_path(file_path)
            file_text_parts = []
            for idx, img in enumerate(images, 1):
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                page_text = apple_neural_ocr_image(buffered.getvalue())
                file_text_parts.append(f"\\n--- [PDF: {filename} - PAGE {idx}] ---\\n{page_text}")
            file_text = "\\n".join(file_text_parts)
        else:''',
'''        if filename.lower().endswith(".pdf"):
            if IS_MAC:
                images = convert_from_path(file_path)
                file_text_parts = []
                for idx, img in enumerate(images, 1):
                    buffered = BytesIO()
                    img.save(buffered, format="PNG")
                    page_text = apple_neural_ocr_image(buffered.getvalue())
                    file_text_parts.append(f"\\n--- [PDF: {filename} - PAGE {idx}] ---\\n{page_text}")
                file_text = "\\n".join(file_text_parts)
            else:
                file_text = f"\\n--- [PDF: {filename}] ---\\n[MOCKED OCR CONTENT: PDF processing skipped on Windows to avoid poppler/mac-exclusive dependencies.]"
        else:''')

with open('pdf_processor.py', 'w', encoding='utf-8') as f:
    f.write(content)
