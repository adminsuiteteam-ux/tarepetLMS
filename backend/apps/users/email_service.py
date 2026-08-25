import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def mask_email(email: str) -> str:
    """Mask email for safe client-side preview, e.g. o***r@tarepet.com"""
    if not email or '@' not in email:
        return email
    user_part, domain = email.split('@', 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + '*'
    else:
        masked_user = user_part[0] + '*' * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"


def send_otp_email(user, raw_code: str, validity_minutes: int = 5) -> bool:
    """
    Sends a beautifully branded HTML email containing the 6-digit OTP code to the user.
    """
    subject = f"🔐 {raw_code} is your Tarepet Montessori Authentication Code"
    recipient = user.email
    full_name = user.get_full_name() or user.email
    role_label = user.get_role_display() if hasattr(user, 'get_role_display') else user.role

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 24px;
          color: #1e293b;
        }}
        .container {{
          max-width: 540px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }}
        .header {{
          background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }}
        .header h1 {{
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }}
        .header p {{
          margin: 6px 0 0;
          font-size: 12px;
          opacity: 0.85;
          text-transform: uppercase;
          letter-spacing: 1px;
        }}
        .body-content {{
          padding: 32px 28px;
        }}
        .salutation {{
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #0f172a;
        }}
        .message {{
          font-size: 13px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }}
        .otp-box {{
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        }}
        .otp-code {{
          font-family: 'Courier New', Courier, monospace;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #1e3a8a;
          margin: 0;
        }}
        .expiry-badge {{
          display: inline-block;
          margin-top: 10px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }}
        .warning-box {{
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 12px 16px;
          border-radius: 6px;
          margin-top: 24px;
        }}
        .warning-box p {{
          margin: 0;
          font-size: 11px;
          line-height: 1.5;
          color: #92400e;
        }}
        .footer {{
          background: #f8fafc;
          padding: 20px 24px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TAREPET MONTESSORI SCHOOL</h1>
          <p>Portal Two-Factor Security Verification</p>
        </div>
        <div class="body-content">
          <div class="salutation">Hello {full_name},</div>
          <div class="message">
            A sign-in attempt was initiated for your <strong>{role_label}</strong> account. Please use the 6-digit authentication code below to complete your login:
          </div>
          
          <div class="otp-box">
            <div class="otp-code">{raw_code}</div>
            <div class="expiry-badge">⏱️ Valid for {validity_minutes} minutes</div>
          </div>
          
          <div class="warning-box">
            <p><strong>Security Notice:</strong> Never share this code with anyone. Tarepet IT staff will never ask for your authentication code. If you did not make this request, please contact the Principal's Office or change your password immediately.</p>
          </div>
        </div>
        <div class="footer">
          &copy; Tarepet Montessori School. All rights reserved.<br>
          Automated Security Dispatch System • Bayelsa State, Nigeria
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = f"""
    TAREPET MONTESSORI SCHOOL - Portal Security Verification
    
    Hello {full_name},
    
    Your 6-digit authentication code for your {role_label} login is:
    
    >> {raw_code} <<
    
    This code is valid for {validity_minutes} minutes.
    
    If you did not attempt to sign in, please secure your account immediately.
    """

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Tarepet Security <security@tarepet.com>')

    try:
        msg = EmailMultiAlternatives(subject, plain_text, from_email, [recipient])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"OTP Email dispatched to {recipient}")
        return True
    except Exception as e:
        logger.warning(f"Could not send email via SMTP backend ({e}). OTP Code for {recipient}: [{raw_code}]")
        print("\n=======================================================")
        print(f"[DEV EMAIL OTP DISPATCH] To: {recipient}")
        print(f"CODE: {raw_code}")
        print(f"EXPIRES IN: {validity_minutes} MINUTES")
        print("=======================================================\n")
        return True
