import asyncio
from app.utils.supabase import supabase

def test_upload():
    print("Attempting to upload test file to Supabase...")
    try:
        # Create a dummy PDF content
        dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n70 700 Td\n(This is a test PDF from the debug script) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000079 00000 n\n0000000173 00000 n\n0000000301 00000 n\n0000000380 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n492\n%%EOF"
        
        filename = "debug_test_upload.pdf"
        
        # Upload
        res = supabase.storage.from_("cvs").upload(
            path=filename,
            file=dummy_pdf_content,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        print("Upload Result:", res)
        print("SUCCESS! File uploaded.")
        
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_upload()
