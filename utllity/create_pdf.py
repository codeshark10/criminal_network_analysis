import os
import random
from PIL import Image, ImageDraw, ImageFont


def create_handwritten_fir_pdf(output_pdf="test_handwritten_fir.pdf"):
    # 1. Create a 150 DPI canvas (Letter size: 1275 x 1650 px)
    width, height = 1275, 1650
    # Slightly aged off-white paper color
    img = Image.new("RGB", (width, height), color=(253, 252, 248))
    draw = ImageDraw.Draw(img)

    # 2. Draw notebook ruling lines (light blue lines & red margin)
    margin_x = 180
    line_spacing = 50
    start_y = 220

    # Red left margin line
    draw.line([(margin_x - 20, 0), (margin_x - 20, height)], fill=(230, 150, 150), width=3)

    # Horizontal blue ruled lines
    for y in range(start_y, height - 100, line_spacing):
        draw.line([(60, y), (width - 60, y)], fill=(210, 225, 245), width=2)

    # 3. Detect Native macOS Handwriting Font
    mac_font_paths = [
        "/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf",
        "/System/Library/Fonts/Supplemental/MarkerFelt.ttc",
        "/System/Library/Fonts/Supplemental/Comic Sans MS.ttf"
    ]

    font_file = None
    for path in mac_font_paths:
        if os.path.exists(path):
            font_file = path
            break

    if font_file:
        title_font = ImageFont.truetype(font_file, 42)
        body_font = ImageFont.truetype(font_file, 30)
    else:
        title_font = body_font = ImageFont.load_default()

    # Dark blue fountain pen ink color
    ink_color = (20, 35, 90)

    # 4. Handwritten Narrative Content
    title = "FIRST INFORMATION REPORT (Handwritten Entry)"
    lines = [
        "P.S.: Shivajinagar | FIR No: 0219/2026 | Date: 30-08-2026",
        "Sections: BNS 303(2), 318(4) & Sec 111 (Organized Crime)",
        "----------------------------------------------------------------------",
        "On 30-08-2026 at 20:45 hrs, secret informer reported that",
        "apex suspect Rajesh @ 'Raju' Sharma and associate Anil Kulkarni",
        "were spotted near FC Road driving a Black Tata Harrier",
        "(Reg No: MH-12-AB-4321).",
        "",
        "On searching the vehicle, officers recovered:",
        "  1. Cash amounting to Rs 8,50,000/- in marked notes.",
        "  2. Two unregistered SIM cards (Vi network).",
        "  3. Fake Bank Receipts (BRs) stamped Bank of Karad.",
        "",
        "Raju Sharma confessed to working under instructions of 'Bhai'.",
        "Funds were being transferred into SBI Account No: 1092837401.",
        "Spot Panchnama done by Inspector R. Shinde in presence of witnesses.",
        "Both accused remanded to police custody. Investigation ongoing."
    ]

    # Draw Title
    draw.text((margin_x + 50, 120), title, font=title_font, fill=(15, 25, 65))

    # 5. Render Text Line-by-Line with Synthetic Handwriting Jitter
    current_y = start_y - 10
    for line in lines:
        if not line:
            current_y += line_spacing
            continue

        # Add slight natural handwriting positioning offset
        offset_x = margin_x + random.randint(-4, 4)
        offset_y = current_y + random.randint(-3, 3)

        # Slight color intensity variation per line (simulates pen pressure)
        r = ink_color[0] + random.randint(-5, 10)
        g = ink_color[1] + random.randint(-5, 10)
        b = ink_color[2] + random.randint(-5, 10)
        line_ink = (max(0, r), max(0, g), max(0, b))

        draw.text((offset_x, offset_y), line, font=body_font, fill=line_ink)
        current_y += line_spacing

    # 6. Save directly as PDF
    img.save(output_pdf, "PDF", resolution=150.0)
    print(f"[✓] Generated realistic handwritten PDF: {output_pdf}")


if __name__ == "__main__":
    create_handwritten_fir_pdf()