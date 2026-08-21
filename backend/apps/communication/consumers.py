import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class LiveEventsConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time WebSocket consumer handling cross-portal live sync:
    - CBT exam publishing & attempts
    - Academic Broadsheet & Grade updates
    - Roster & Teacher/Student profile updates
    - Real-time Notifications & Activities
    - Live Payment updates
    """

    async def connect(self):
        # Join global broadcast room
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
        """
        msg_type = content.get('type', 'UNKNOWN')

        if msg_type == 'PING':
            await self.send_json({'type': 'PONG', 'timestamp': content.get('timestamp')})
            return

        # Forward mutation events to all connected clients
        if msg_type in [
            'CBT_STORE_MUTATED',
            'NOTIFICATION_RECEIVED',
            'ACTIVITY_LOGGED',
            'PAYMENTS_MUTATED',
            'ROSTER_UPDATED',
            'BROADSHEET_SCORES_UPDATED',
            'ATTENDANCE_MARKED',
            'AVATAR_UPDATED',
            'PROFILE_UPDATED',
        ]:
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
