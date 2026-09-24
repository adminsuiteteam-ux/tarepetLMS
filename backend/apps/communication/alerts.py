import time
import traceback
from django.conf import settings
from django.core.mail import send_mail
from .models import ActivityLog, SystemAlert

_alert_rate_limits = {}

def get_client_ip(request):
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

def log_system_activity(activity_type, title, detail='', user='', request=None, severity='INFO', category='SYSTEM'):
    """
    Central helper to record audit events across Tarepet LMS.
    """
    try:
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '') if request else ''
        if not user and request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user.email
        return ActivityLog.objects.create(
            activity_type=activity_type,
            title=title,
            detail=str(detail),
            user=str(user or 'System / Anonymous'),
            ip_address=ip,
            user_agent=ua[:500] if ua else '',
            severity=severity,
            category=category,
        )
    except Exception as e:
        # Fallback to avoid logging failures crashing the caller
        print(f"[ActivityLog Error] Failed to write log: {e}")
        return None

def dispatch_live_alert(alert_type, title, details, request=None, severity='HIGH', url=None):
    """
    Real-time dispatch system for critical application events:
    - Broken frontend code & runtime uncaught errors
    - Backend 500 exceptions / server crashes
    - Unresponsive UI / dead click freezes
    - Database usage & connectivity spikes
    - Security breaches & suspicious tampering
    - Network degradation & offline bursts
    """
    ip = get_client_ip(request)
    ua = request.META.get('HTTP_USER_AGENT', '') if request else ''
    target_url = url or (request.build_absolute_uri() if request else 'Internal System Engine')
    user_str = ''
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        user_str = f"{request.user.email} (Role: {getattr(request.user, 'role', 'Unknown')})"
    else:
        user_str = 'Anonymous / Unauthenticated Client'

    # Deduplicate alerts within 5 minutes to avoid email storms
    fingerprint = f"{alert_type}_{title[:80]}_{str(details)[:120]}"
    now = time.time()
    last_sent = _alert_rate_limits.get(fingerprint, 0)
    throttled = (now - last_sent < 300)

    # Always log to database
    alert_record = None
    try:
        alert_record = SystemAlert.objects.create(
            alert_type=alert_type,
            title=title,
            details=str(details),
            url=target_url[:500],
            ip_address=ip,
            user_agent=ua[:500] if ua else '',
            severity=severity,
            email_dispatched=not throttled,
            recipient=getattr(settings, 'ADMIN_ALERT_EMAIL', getattr(settings, 'EMAIL_HOST_USER', 'tarepetm@gmail.com')) or 'tarepetm@gmail.com'
        )
        log_system_activity(
            activity_type=f"ALERT_{alert_type}",
            title=f"Live Alert: {title}",
            detail=str(details)[:500],
            user=user_str,
            request=request,
            severity=severity,
            category='SECURITY' if alert_type == 'SECURITY_BREACH' else 'SYSTEM'
        )
    except Exception as db_err:
        print(f"[SystemAlert DB Error] {db_err}")

    if throttled:
        return {'status': 'throttled', 'alert_id': alert_record.id if alert_record else None}

    _alert_rate_limits[fingerprint] = now

    # Determine visual badge colors based on severity
    color_map = {
        'CRITICAL': ('#dc2626', '#b91c1c', 'CRITICAL PRIORITY'),
        'HIGH': ('#ea580c', '#c2410c', 'HIGH SEVERITY'),
        'MEDIUM': ('#d97706', '#b45309', 'MEDIUM ATTENTION'),
        'LOW': ('#2563eb', '#1d4ed8', 'OPERATIONAL NOTICE')
    }
    header_color, border_color, badge_text = color_map.get(severity.upper(), ('#dc2626', '#b91c1c', 'ALERT'))

    admin_recipients = [
        getattr(settings, 'ADMIN_ALERT_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None) or 'tarepetm@gmail.com',
        'admissions@tarepetmontessorischool.com'
    ]
    # Filter out empty or duplicate emails
    admin_recipients = list(dict.fromkeys([e for e in admin_recipients if e and '@' in e]))

    subject = f"🚨 [{badge_text}] {title} — Tarepet LMS Live Telemetry"

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, {header_color}, {border_color}); padding: 28px 32px; color: #ffffff;">
          <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
            {badge_text} • {alert_type.replace('_', ' ')}
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">{title}</h1>
          <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">Tarepet Montessori School — Automated Live System Guardian</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px;">
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 140px;"><strong>Trigger Time:</strong></td>
              <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-family: monospace;">{time.strftime('%Y-%m-%d %H:%M:%S UTC')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>Target Endpoint:</strong></td>
              <td style="padding: 8px 0; font-size: 13px; color: #0284c7; word-break: break-all;">{target_url}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>User Context:</strong></td>
              <td style="padding: 8px 0; font-size: 13px; color: #0f172a;">{user_str}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>Client IP Address:</strong></td>
              <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-family: monospace;">{ip or 'Unavailable'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 13px; color: #64748b;"><strong>Device / Agent:</strong></td>
              <td style="padding: 8px 0; font-size: 12px; color: #475569; word-break: break-all;">{ua or 'Unknown User Agent'}</td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Diagnostic & Trace Payload</h3>
            <pre style="background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 10px; font-size: 12px; font-family: 'Consolas', 'Monaco', monospace; line-height: 1.5; overflow-x: auto; max-height: 350px; white-space: pre-wrap; word-break: break-all;">{details}</pre>
          </div>

          <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; color: #166534; font-size: 13px;">
            <strong>Suggested Actions:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
              <li>Review the latest entries in the <strong>Admin Dashboard &rarr; Activity Logs</strong>.</li>
              <li>Inspect server deployments on Render for memory/CPU constraints or runtime uncaught exceptions.</li>
              <li>Verify database connection pool status on Layerbase serverless Postgres.</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
          Tarepet Montessori School LMS &bull; Live Telemetry & System Status Daemon<br>
          <a href="https://tarepetmontessorischool.com/dashboard/admin" style="color: #0284c7; text-decoration: none; font-weight: 600;">Access Admin Management Console &rarr;</a>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Tarepet LMS Guardian <admissions@tarepetmontessorischool.com>')
        send_mail(
            subject=subject,
            message=f"Tarepet Live System Alert [{severity}]\nType: {alert_type}\nTitle: {title}\nURL: {target_url}\nUser: {user_str}\nIP: {ip}\nDetails:\n{details}",
            from_email=from_email,
            recipient_list=admin_recipients,
            html_message=html_message,
            fail_silently=False,
        )
        if alert_record:
            alert_record.email_dispatched = True
            alert_record.save(update_fields=['email_dispatched'])
    except Exception as email_err:
        print(f"[Live Alert Email Failed] {email_err}")

    return {'status': 'dispatched', 'alert_id': alert_record.id if alert_record else None}
