import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class LiveEventsConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time WebSocket consumer handling cross-portal live sync:
    - CBT exam publishing, authoring & student submissions
    - Academic Broadsheet & Grade updates
    - Roster & Teacher/Student profile updates
    - Real-time Notifications & Activities (persisted to database)
    - Live Payment & financial mutations
    """

    async def connect(self):
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
            'message': 'Tarepet LMS WebSocket Live Gateway connected.',
        })

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        """
        Handle incoming WebSocket messages from clients.
        Persist relevant notifications and activity logs to database, then broadcast to all clients.
        """
        if not isinstance(content, dict):
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

        # 1. Persist Notifications to Database
        if msg_type in ['NOTIFICATION_RECEIVED', 'EXAM_CREATED', 'EXAM_APPROVED', 'EXAM_ACTIVATED', 'EXAM_REJECTED']:
            await self._save_notification(msg_type, payload or content)

        # 2. Persist Activities to Database
        if msg_type in ['ACTIVITY_LOGGED', 'EXAM_CREATED', 'EXAM_APPROVED', 'EXAM_ACTIVATED', 'EXAM_REJECTED', 'SUBMISSION_RECEIVED']:
            await self._save_activity_log(msg_type, payload or content)

        # 3. Broadcast to all active clients across tabs/devices
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
            title = data.get('title') or f"Update: {msg_type}"
            message = data.get('message') or data.get('detail') or str(data)
            ntype = data.get('type') or data.get('notification_type') or 'info'
            role = data.get('recipientRole') or data.get('recipient_role') or 'ALL'
            Notification.objects.create(
                title=title[:255],
                message=message,
                notification_type=ntype[:50],
                recipient_role=role[:50]
            )
        except Exception as e:
            logger.debug("Failed to persist notification from WebSocket: %s", e)

    @database_sync_to_async
    def _save_activity_log(self, msg_type: str, data: dict):
        try:
            from apps.communication.models import ActivityLog
            title = data.get('title') or f"Event: {msg_type}"
            detail = data.get('detail') or data.get('message') or ''
            user = data.get('user') or data.get('sender') or 'System'
            ActivityLog.objects.create(
                activity_type=msg_type[:100],
                title=title[:255],
                detail=detail,
                user=str(user)[:255]
            )
        except Exception as e:
            logger.debug("Failed to persist activity log from WebSocket: %s", e)

