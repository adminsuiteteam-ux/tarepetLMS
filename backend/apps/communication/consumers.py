import json
import logging
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_jwt_token(token_str: str):
    """Validate SimpleJWT access token and return the active user instance."""
    try:
        token = AccessToken(token_str)
        user_id = token['user_id']
        return CustomUser.objects.filter(id=user_id, is_active=True).first()
    except Exception as e:
        logger.debug("WebSocket JWT validation failed: %s", e)
        return None


class LiveEventsConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time WebSocket consumer handling authenticated cross-portal live sync:
    - CBT exam publishing, authoring & student submissions
    - Academic Broadsheet & Grade updates
    - Roster & Teacher/Student profile updates
    - Real-time Notifications & Activities (persisted to database)
    - Live Payment & financial mutations
    """

    async def connect(self):
        user = self.scope.get('user')

        # If not authenticated via session cookie, extract JWT token from query string
        if not user or not getattr(user, 'is_authenticated', False):
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            params = parse_qs(query_string)
            token_list = params.get('token', [])
            if token_list:
                user = await get_user_from_jwt_token(token_list[0])

        if not user or not getattr(user, 'is_authenticated', False):
            logger.warning("Rejected unauthenticated WebSocket connection attempt.")
            await self.close(code=4001)
            return

        self.user = user
        self.room_name = 'broadcast'
        self.room_group_name = 'tarepet_live_events'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

        # Send welcome handshake
        await self.send_json({
            'type': 'CONNECTION_ESTABLISHED',
            'status': 'connected',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': getattr(user, 'role', 'UNKNOWN'),
            },
            'message': 'Tarepet LMS WebSocket Live Gateway connected.',
        })

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        """
        Handle incoming WebSocket messages from authenticated clients.
        Persist relevant notifications and activity logs to database, then broadcast to all clients.
        """
        if not isinstance(content, dict):
            return

        if not hasattr(self, 'user') or not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        msg_type = content.get('type', 'UNKNOWN')

        if msg_type == 'PING':
            await self.send_json({'type': 'PONG', 'timestamp': content.get('timestamp')})
            return

        payload = content.get('payload', {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception:
                payload = {}

        # 1. Persist Notifications to Database (only genuine notifications from authorized staff/admin)
        if msg_type == 'NOTIFICATION_RECEIVED':
            await self._save_notification(msg_type, payload or content)

        # 2. Persist Activities to Database
        if msg_type in ['ACTIVITY_LOGGED', 'EXAM_CREATED', 'EXAM_APPROVED', 'EXAM_ACTIVATED', 'EXAM_REJECTED', 'SUBMISSION_RECEIVED']:
            await self._save_activity_log(msg_type, payload or content)

        # 3. Add authenticated sender metadata
        content['sender_id'] = self.user.id
        content['sender_email'] = self.user.email

        # 4. Broadcast to all active clients across tabs/devices
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_event',
                'data': content
            }
        )

    async def broadcast_event(self, event):
        """
        Handler called when group_send dispatches a message.
        """
        await self.send_json(event['data'])

    @database_sync_to_async
    def _save_notification(self, msg_type: str, data: dict):
        try:
            from apps.communication.models import Notification
            # Students are not permitted to inject global system notifications
            is_staff_or_admin = (
                self.user.is_staff or
                self.user.is_superuser or
                getattr(self.user, 'role', '') in ('ADMIN', 'TEACHER')
            )
            if not is_staff_or_admin:
                return

            title = data.get('title')
            message = data.get('message') or data.get('detail')
            if not title or not message or isinstance(message, (dict, list)):
                return
            ntype = data.get('type') or data.get('notification_type') or 'info'
            role = data.get('recipientRole') or data.get('recipient_role') or data.get('role') or 'ALL'
            Notification.objects.create(
                title=str(title)[:255],
                message=str(message),
                notification_type=str(ntype)[:50],
                recipient_role=str(role)[:50]
            )
        except Exception as e:
            logger.debug("Failed to persist notification from WebSocket: %s", e)

    @database_sync_to_async
    def _save_activity_log(self, msg_type: str, data: dict):
        try:
            from apps.communication.models import ActivityLog
            title = data.get('title') or f"Event: {msg_type}"
            detail = data.get('detail') or data.get('message') or ''
            user_display = self.user.get_full_name() or self.user.email
            role_display = getattr(self.user, 'role', '')
            if role_display:
                user_display = f"{user_display} ({role_display})"

            ActivityLog.objects.create(
                activity_type=msg_type[:100],
                title=str(title)[:255],
                detail=str(detail),
                user=str(user_display)[:255]
            )
        except Exception as e:
            logger.debug("Failed to persist activity log from WebSocket: %s", e)

