import fitz
import os

pdf_path = r'd:\QuocAnh\qa-bqldacn\Doccument\TT24-2025.pdf'
out_path = r'd:\QuocAnh\qa-bqldacn\Doccument\tt24_phu_luc_iii.txt'

doc = fitz.open(pdf_path)
print(f"Total pages: {doc.page_count}")

# First, find pages mentioning Phụ lục III
phu_luc_pages = []
for i, page in enumerate(doc):
    text = page.get_text()
    if 'PHỤ LỤC III' in text.upper() or 'PHU LUC III' in text.upper():
        phu_luc_pages.append(i)
        print(f"Found 'Phụ lục III' on page {i+1}")

# If not found, search for 'Phụ lục' generally
if not phu_luc_pages:
    for i, page in enumerate(doc):
        text = page.get_text()
        if 'phụ lục' in text.lower() or 'PHỤ LỤC' in text:
            phu_luc_pages.append(i)
            print(f"Found 'Phụ lục' ref on page {i+1}")

# Extract text from table of contents and appendix pages
# Get full text from relevant pages (start from found pages, go forward 20 pages)
if phu_luc_pages:
    start = min(phu_luc_pages)
    end = min(start + 25, doc.page_count)
else:
    # Fallback: extract last 30 pages (appendices are usually at the end)
    start = max(0, doc.page_count - 30)
    end = doc.page_count
    print(f"No 'Phụ lục III' found, extracting pages {start+1}-{end}")

extracted = []
for i in range(start, end):
    page = doc[i]
    text = page.get_text()
    extracted.append(f"\n=== PAGE {i+1} ===\n{text}")

with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(extracted))

print(f"Extracted {len(extracted)} pages to {out_path}")
doc.close()
