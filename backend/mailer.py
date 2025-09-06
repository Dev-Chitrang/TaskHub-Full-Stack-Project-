from email.message import EmailMessage
import smtplib
import os
from urllib.parse import quote_plus

EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv("SMTP_USER")
EMAIL_HOST_PASSWORD = os.getenv("SMTP_PASS")
FRONTEND_URL = os.getenv("FRONTEND_URL", "").rstrip("/")


def send_email(
    to: str, subject: str, body_text: str | None = None, body_html: str | None = None
) -> bool:
    if not to or "@" not in to:
        raise ValueError(f"Invalid recipient email: {to}")

    msg = EmailMessage()
    msg["From"] = EMAIL_HOST_USER
    msg["To"] = to
    msg["Subject"] = subject

    if body_text:
        msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        server.send_message(msg)
    return True


def generate_email(
    token: str,
    to: str,
    purpose: str,
    workspace_id: str | None = None,
    workspace_name: str | None = None,
    workspaceColor: str | None = None,
) -> bool:
    if purpose == "verify-email":
        subject = "Verify your email"
        path = "auth/verify-email"
        cta = "VERIFY EMAIL"
        link = f"{FRONTEND_URL}/{path}?token={token}"
        text = f"Click the link: {link}"
        html = f"<p><a href='{link}'>{cta}</a></p>"
    elif purpose == "reset-password":
        subject = "Reset your password"
        path = "auth/reset-password"
        cta = "RESET PASSWORD"
        link = f"{FRONTEND_URL}/{path}?token={token}"
        text = f"Click the link: {link}"
        html = f"<p><a href='{link}'>{cta}</a></p>"
    elif purpose == "invite-user":
        cta = "ACCEPT INVITE"
        subject = "You have been invited to a workspace"
        path = "workspace/invite-user"
        if workspace_id and workspace_name and workspaceColor:
            link = (
                f"{FRONTEND_URL}/{path}"
                f"?workspaceId={workspace_id}"
                f"&workspaceName={quote_plus(workspace_name)}"
                f"&workspaceColor={quote_plus(workspaceColor)}"
                f"&token={token}"
            )
        else:
            link = f"{FRONTEND_URL}/{path}?token={token}"
        text = f"Click the link: {link}"
        html = f"<p><a href='{link}'>{cta}</a></p>"
    elif purpose == "twofa-otp":
        subject = "Your Two-Factor Authentication OTP"
        text = f"Your OTP is: {token}. It is valid for 5 minutes."
        html = f"<p>Your OTP is: <b>{token}</b>. It is valid for 5 minutes.</p>"
    else:
        subject = "Notification"
        text = f"Message: {token}"
        html = f"<p>{token}</p>"

    return send_email(to, subject, text, html)
