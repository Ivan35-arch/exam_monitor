import sys
import json
import re
import os
import pdfplumber

def clean_time(raw_time):
    """Fixes typos in the PDF like '08:30-1030:' or '08.30-10.30'"""
    digits = re.findall(r'\d', raw_time)
    if len(digits) >= 8:
        return f"{digits[0]}{digits[1]}:{digits[2]}{digits[3]}-{digits[4]}{digits[5]}:{digits[6]}{digits[7]}"
    return raw_time.replace('\n', '').replace('.', ':').strip()

def parse_2025_timetable(pdf_path):
    exams = []
    
    # State trackers for carried-forward layout data
    current_date = None
    current_time = None
    current_unit_code = None
    current_unit_name = None
    current_venue = None
    
    # Regex patterns
    date_regex = re.compile(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)', re.IGNORECASE)
    unit_regex = re.compile(r'^([A-Z]{3,4}\s*\d{4}[A-Z]*)\s*:\s*(.+)', re.IGNORECASE)

    # ─── UPDATED MEASUREMENTS (CM TO POINTS) ───
    POINTS_PER_CM = 28.3465
    
    X0 = 0.6 * POINTS_PER_CM        # Reduced by 0.4cm (~17.01 points)
    X1 = 27.6 * POINTS_PER_CM       # Remains unchanged (~782.36 points)
    TOP = 8.7 * POINTS_PER_CM       # Remains unchanged (~246.61 points)
    BOTTOM = 20.1 * POINTS_PER_CM   # Reduced by 0.3cm (~569.76 points)
    
    CROP_BOX = (X0, TOP, X1, BOTTOM)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            
            # ─── VISUALIZATION ENGINE (OPTIONAL DEBUG OUTPUT) ───
            try:
                page_one = pdf.pages[0]
                img = page_one.to_image(resolution=150)
                img.draw_rect({
                    "x0": X0, "top": TOP, "x1": X1, "bottom": BOTTOM,
                    "stroke": "red", "stroke_width": 3, "fill": None
                })
                img.save("debug_crop.png", format="PNG")
                print("DEBUG LOG: Visual crop overlay saved to 'debug_crop.png'", file=sys.stderr)
            except Exception as img_err:
                print(f"DEBUG LOG: Visualization warning: {img_err}", file=sys.stderr)

            # ─── MAIN EXTRACTION LOOP (FIRST 15 PAGES) ───
            for page in pdf.pages[:15]:
                
                cropped_page = page.crop(CROP_BOX)
                table = cropped_page.extract_table()
                if not table:
                    continue
                
                for row in table:
                    clean_row = [str(cell).strip() if cell else "" for cell in row]
                    
                    if len(clean_row) < 7:
                        continue
                        
                    if "DATE" in clean_row[0].upper() or "EXAMINATION" in clean_row[2].upper():
                        continue
                        
                    # Column 0: Date
                    if clean_row[0] and date_regex.search(clean_row[0]):
                        current_date = clean_row[0].replace('\n', ' ').strip()
                        
                    # Column 1: Time
                    if clean_row[1]:
                        current_time = clean_time(clean_row[1])
                        
                    # Column 2: Examinations (Unit Code + Name)
                    raw_exam_cell = clean_row[2]
                    if raw_exam_cell:
                        exam_lines = raw_exam_cell.split('\n')
                        for line in exam_lines:
                            match = unit_regex.match(line.strip())
                            if match:
                                current_unit_code = match.group(1).strip()
                                current_unit_name = match.group(2).strip()
                                break
                                
                    # Column 5: Venue
                    if clean_row[5]:
                        current_venue = clean_row[5].replace('\n', ' ').strip()
                        
                    # Column 3: Group Name
                    raw_groups_cell = clean_row[3]
                    if raw_groups_cell:
                        groups_list = [g.strip() for g in raw_groups_cell.split('\n') if g.strip()]
                        
                        for group in groups_list:
                            if current_date and current_time and current_unit_code:
                                
                                duration = 120  
                                try:
                                    times = current_time.split('-')
                                    if len(times) == 2:
                                        h1, m1 = map(int, times[0].split(':'))
                                        h2, m2 = map(int, times[1].split(':'))
                                        duration = ((h2 * 60) + m2) - ((h1 * 60) + m1)
                                except Exception:
                                    pass
                                
                                exams.append({
                                    "exam_date": current_date,
                                    "exam_time": current_time.split('-')[0].strip(),
                                    "duration_minutes": duration,
                                    "unit_code": current_unit_code,
                                    "unit_name": current_unit_name,
                                    "group_name": group,
                                    "venue": current_venue if current_venue else "TBD"
                                })

        print(json.dumps(exams))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    default_pdf_path = r"C:\Users\ADMIN\Downloads\Undergraduate FT November 2025 Timetable Final (1) (1).pdf"
    
    if len(sys.argv) >= 2:
        pdf_path = sys.argv[1]
    else:
        pdf_path = default_pdf_path
        
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"PDF file not found: {pdf_path}"}))
        sys.exit(1)
        
    parse_2025_timetable(pdf_path)