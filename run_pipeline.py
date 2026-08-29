import os
import glob
import asyncio

# Import all step functions
from step1_chunking import run_step1
from step2_coref import run_step2
from step3_extraction import run_step3
from step4_resolution import run_step4
from step5_ingest import run_step5

# Base folder where your endpoints save files
UPLOAD_DIR = "./uploaded_cases"


async def run_full_pipeline(case_id: str):
    print(f"\n{'=' * 50}\nSTARTING GRAPHRAG PIPELINE FOR CASE: {case_id}\n{'=' * 50}")

    case_folder = os.path.join(UPLOAD_DIR, case_id)
    if not os.path.exists(case_folder):
        print(f"[ERROR] Directory not found: {case_folder}")
        return

    # Find all raw text files uploaded to this case folder
    txt_files = glob.glob(os.path.join(case_folder, "*.txt"))
    if not txt_files:
        print(f"[ERROR] No .txt files found in {case_folder}")
        return

    for file_path in txt_files:
        print(f"\n>> Processing File: {os.path.basename(file_path)}")
        try:
            # Sequential Execution
            path_step1 = run_step1(case_id, file_path)
            path_step2 = run_step2(path_step1)
            path_step3 = await run_step3(path_step2)
            path_step4 = run_step4(path_step3)
            run_step5(case_id, path_step4)

            print(f"\n>> ✓ SUCCESS: Fully processed {os.path.basename(file_path)}!")

        except Exception as e:
            print(f"\n>> [FATAL ERROR] Pipeline failed on {file_path}: {str(e)}")

    print(f"\n{'=' * 50}\nPIPELINE COMPLETED FOR CASE: {case_id}\n{'=' * 50}\n")


if __name__ == "__main__":
    # Example usage: Change this to whichever case you want to process!
    TARGET_CASE_ID = "CASE_47186001"

    # Run the async pipeline loop
    asyncio.run(run_full_pipeline(TARGET_CASE_ID))