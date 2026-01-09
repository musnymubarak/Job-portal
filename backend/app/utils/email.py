import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_email(email_to: str, subject: str, html_content: str) -> None:
    if not settings.EMAILS_ENABLED:
        logger.info(f"Emails disabled. Would send to {email_to}: {subject}")
        return

    if not settings.SMTP_HOST or not settings.SMTP_PORT or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP settings not configured. Printing email to console.")
        logger.info(f"--- EMAIL START ---\nTo: {email_to}\nSubject: {subject}\n\n{html_content}\n--- EMAIL END ---")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = email_to
        msg["Subject"] = subject

        msg.attach(MIMEText(html_content, "html"))

        print(f"DEBUG: Connecting to SMTP {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            print("DEBUG: SMTP Connected. Starting TLS...")
            server.starttls()
            print("DEBUG: TLS Started. Logging in...")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            print("DEBUG: Logged in. Sending message...")
            server.send_message(msg)
            print("DEBUG: Message sent via SMTP.")
        
        logger.info(f"Email sent to {email_to}")
        print(f"DEBUG: Email sent to {email_to} successfully.")

    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {e}")
        print(f"DEBUG: ERROR sending email: {e}")
        # Print full traceback to help debug
        import traceback
        traceback.print_exc()

def send_reset_password_email(email_to: str, email: str, token: str) -> None:
    subject = f"{settings.PROJECT_NAME} - Password Recovery"
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <html>
        <body>
            <h1>Password Recovery</h1>
            <p>Hello,</p>
            <p>We received a request to reset your password for your account associated with {email}.</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="{link}">Reset Password</a></p>
            <p>If you did not request this, please ignore this email. The link will expire in {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes.</p>
            <br>
            <p>Best regards,</p>
            <p>{settings.EMAILS_FROM_NAME}</p>
        </body>
    </html>
    """
    send_email(email_to, subject, html_content)
