from fastapi import APIRouter
from app.core.config import settings
import smtplib
from email.mime.text import MIMEText
import logging

router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/test-email")
def test_email(email: str = None):
    results = []
    
    # Check 1: Settings
    results.append(f"Config: HOST={settings.SMTP_HOST}, PORT={settings.SMTP_PORT}, USER={settings.SMTP_USER}")
    
    target_email = email or settings.SMTP_USER
    if not target_email:
         return {"error": "No target email provided and no SMTP_USER set"}

    # Attempt 1: Standard TLS (587)
    results.append("--- Attempting TLS (Port 587) ---")
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, 587, timeout=10)
        server.set_debuglevel(1)
        results.append("Connected to 587. Starting TLS...")
        server.starttls()
        results.append("TLS Started. Logging in...")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        results.append("Logged in. Sending test msg...")
        
        msg = MIMEText("Test from Render Debug Endpoint (TLS)")
        msg['Subject'] = "Test TLS"
        msg['From'] = settings.EMAILS_FROM_EMAIL
        msg['To'] = target_email
        
        server.send_message(msg)
        server.quit()
        results.append("SUCCESS: Sent via TLS (587)!")
    except Exception as e:
        results.append(f"FAILURE TLS: {str(e)}")

    # Attempt 2: SSL (Port 465)
    results.append("--- Attempting SSL (Port 465) ---")
    try:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=10)
        server.set_debuglevel(1)
        results.append("Connected to 465 (SSL). Logging in...")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        results.append("Logged in. Sending test msg...")
        
        msg = MIMEText("Test from Render Debug Endpoint (SSL)")
        msg['Subject'] = "Test SSL"
        msg['From'] = settings.EMAILS_FROM_EMAIL
        msg['To'] = target_email
        
        server.send_message(msg)
        server.quit()
        results.append("SUCCESS: Sent via SSL (465)!")
    except Exception as e:
        results.append(f"FAILURE SSL: {str(e)}")

    return {"logs": results}
