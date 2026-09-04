import os
import hashlib
import platform
from datetime import datetime, timezone
from io import BytesIO

# Platform-specific imports for Apple Native OCR
IS_MAC = platform.system() == 'Darwin'
if IS_MAC:
    from pdf2image import convert_from_path
    import Vision
    import Quartz


def compute_file_hash(file_bytes: bytes) -> str:
    """Computes SHA-256 cryptographic hash of raw file bytes[cite: 1]."""
    return hashlib.sha256(file_bytes).hexdigest()


def apple_neural_ocr_image(image_bytes: bytes) -> str:
    """
    Executes lightning-fast OCR using Apple's Native Vision Framework
    directly on the Apple Silicon Neural Engine (~0.1s per page)[cite: 1].
    """
    if not IS_MAC:
        return "[MOCKED OCR CONTENT: Apple Vision Framework not available on Windows]"

    data = Quartz.NSData.dataWithBytes_length_(image_bytes, len(image_bytes))
    image_source = Quartz.CGImageSourceCreateWithData(data, None)
    if not image_source:
        return ""

    cg_image = Quartz.CGImageSourceCreateImageAtIndex(image_source, 0, None)
    if not cg_image:
        return ""

    handler = Vision.VNImageRequestHandler.alloc().initWithCGImage_options_(cg_image, None)
    request = Vision.VNRecognizeTextRequest.alloc().init()

    # Configure for high accuracy and handwriting support[cite: 1]
    request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    request.setUsesLanguageCorrection_(True)

    success, error = handler.performRequests_error_([request], None)
    if not success:
        return ""

    observations = request.results()
    transcribed_lines = []
    if observations:
        for observation in observations:
            top_candidate = observation.topCandidates_(1)
            if top_candidate:
                transcribed_lines.append(top_candidate[0].string())

    return "\n".join(transcribed_lines)


def compile_master_dossier_from_disk(case_dir: str, original_files: list, case_id: str) -> str:
    """
    Reads saved .txt and .pdf files from disk, runs Apple Neural OCR on PDFs,
    appends provenance metadata headers, and creates a single unified master dossier file[cite: 1].
    """
    master_content_parts = []
    total_files = len(original_files)

    for file_obj in original_files:
        filename = file_obj.filename
        file_path = os.path.join(case_dir, filename)

        with open(file_path, "rb") as f:
            content_bytes = f.read()

        file_hash = compute_file_hash(content_bytes)

        if filename.lower().endswith(".pdf"):
            if IS_MAC:
                images = convert_from_path(file_path)
                file_text_parts = []
                for idx, img in enumerate(images, 1):
                    buffered = BytesIO()
                    img.save(buffered, format="PNG")
                    page_text = apple_neural_ocr_image(buffered.getvalue())
                    file_text_parts.append(f"\n--- [PDF: {filename} - PAGE {idx}] ---\n{page_text}")
                file_text = "\n".join(file_text_parts)
            else:
                file_text = f"\n--- [PDF: {filename}] ---\n[MOCKED OCR CONTENT: PDF processing skipped on Windows to avoid poppler/mac-exclusive dependencies.]"
        else:
            file_text = content_bytes.decode("utf-8", errors="ignore")

        # Provenance header for source lineage tracking[cite: 1]
        file_header = (
            f"\n==================================================\n"
            f"SOURCE FILE: {filename}\n"
            f"SHA-256 HASH: {file_hash}\n"
            f"==================================================\n"
        )
        master_content_parts.append(file_header + file_text + "\n")

    timestamp = datetime.now(timezone.utc).isoformat()
    master_header = (
        f"##################################################\n"
        f"MASTER CASE DOSSIER: {case_id}\n"
        f"GENERATED TIMESTAMP: {timestamp}\n"
        f"TOTAL SOURCE FILES COMPILED: {total_files}\n"
        f"##################################################\n\n"
    )

    master_dossier_text = master_header + "\n".join(master_content_parts)
    master_dossier_path = os.path.join(case_dir, f"{case_id}_master_dossier.txt")

    with open(master_dossier_path, "w", encoding="utf-8") as f:
        f.write(master_dossier_text)

    return master_dossier_path