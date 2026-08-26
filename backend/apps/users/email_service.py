import logging, threading
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _dispatch_email_async(msg: EmailMultiAlternatives, recipient: str, log_desc: str = "Email"):
    """Dispatches email in a background daemon thread to eliminate API latency."""
    def _worker():
        try:
            msg.send(fail_silently=False)
            logger.info(f"{log_desc} successfully dispatched to {recipient}")
        except Exception as e:
            logger.warning(f"Could not send {log_desc} to {recipient} via SMTP ({e})")
    
    t = threading.Thread(target=_worker, daemon=True)
    t.start()


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
        _dispatch_email_async(msg, recipient, f"OTP Code ({raw_code})")
        logger.info(f"OTP Email dispatched asynchronously to {recipient}")
        return True
    except Exception as e:
        logger.warning(f"Could not queue OTP email ({e}). OTP Code for {recipient}: [{raw_code}]")
        return True


def send_teacher_welcome_email(
    teacher_email: str,
    teacher_name: str,
    staff_id: str,
    initial_password: str,
    portal_url: str = 'https://tarepet.com/login',
    department: str = 'Montessori Primary'
) -> bool:
    """
    Sends an automated welcome email with teacher account credentials,
    portal access link, and confidentiality instructions.
    """
    subject = f"🎉 Welcome to Tarepet Montessori School Faculty - Your Portal Credentials"
    recipient = teacher_email

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
          max-width: 560px;
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
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #0f172a;
        }}
        .message {{
          font-size: 13px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 20px;
        }}
        .credentials-card {{
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }}
        .cred-row {{
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }}
        .cred-row:last-child {{
          border-bottom: none;
        }}
        .cred-label {{
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }}
        .cred-val {{
          color: #0f172a;
          font-weight: 700;
          font-family: 'Courier New', Courier, monospace;
        }}
        .login-btn {{
          display: block;
          width: fit-content;
          margin: 24px auto;
          background: #1e3a8a;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          text-align: center;
        }}
        .confidential-box {{
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 14px 16px;
          border-radius: 6px;
          margin-top: 24px;
        }}
        .confidential-box p {{
          margin: 0;
          font-size: 11px;
          line-height: 1.6;
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
          <p>Official Faculty Onboarding &amp; Credentials</p>
        </div>
        <div class="body-content">
          <div class="salutation">Welcome to the Team, {teacher_name}!</div>
          <div class="message">
            Your official educator profile has been provisioned on the Tarepet Learning Management &amp; Examination Portal ({department}). Below are your initial login credentials:
          </div>
          
          <div class="credentials-card">
            <div class="cred-row">
              <span class="cred-label">Full Name</span>
              <span class="cred-val" style="font-family: inherit;">{teacher_name}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Official Email</span>
              <span class="cred-val" style="font-family: inherit;">{teacher_email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Staff ID</span>
              <span class="cred-val" style="color: #1e3a8a;">{staff_id}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Initial Password</span>
              <span class="cred-val" style="color: #b91c1c;">{initial_password}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Portal URL</span>
              <span class="cred-val" style="font-family: inherit;">{portal_url}</span>
            </div>
          </div>

          <a href="{portal_url}" class="login-btn">Log In to Educator Portal &rarr;</a>
          
          <div class="confidential-box">
            <p><strong>Strict Confidentiality Notice:</strong><br>
            These login credentials are confidential to you as an accredited faculty member of Tarepet Montessori School. You should never share your password or two-factor authentication codes with anyone, including students, colleagues, or outside parties. Please change your password upon your first login in your portal settings.</p>
          </div>
        </div>
        <div class="footer">
          &copy; Tarepet Montessori School. All rights reserved.<br>
          Office of the Principal &amp; Academic Governance • Yenagoa, Bayelsa State, Nigeria
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = f"""
    TAREPET MONTESSORI SCHOOL - Faculty Onboarding & Credentials
    
    Welcome to the Team, {teacher_name}!
    
    Your official educator profile has been created on the Tarepet Montessori portal.
    
    Credentials:
    • Full Name: {teacher_name}
    • Official Email: {teacher_email}
    • Staff ID: {staff_id}
    • Initial Password: {initial_password}
    • Portal URL: {portal_url}
    
    IMPORTANT CONFIDENTIALITY NOTICE:
    Do not share your login credentials or OTP authentication codes with anyone.
    Please change your password upon your first login.
    """

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Tarepet Montessori Admin <admin@tarepet.com>')

    try:
        msg = EmailMultiAlternatives(subject, plain_text, from_email, [recipient])
        msg.attach_alternative(html_content, "text/html")
        _dispatch_email_async(msg, recipient, f"Welcome Email ({staff_id})")
        logger.info(f"Teacher welcome email queued asynchronously for {recipient}")
        return True
    except Exception as e:
        logger.warning(f"Could not queue teacher welcome email ({e}).")
        return True
