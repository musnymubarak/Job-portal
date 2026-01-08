from typing import List, Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # active_connections: List[WebSocket] = []
        # We can map user_id to a list of sockets (user might have multiple tabs)
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: Any, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast(self, message: Any):
        """Send message to all connected clients."""
        for user_sockets in self.active_connections.values():
            for connection in user_sockets:
                await connection.send_json(message)

    async def broadcast_to_role(self, message: Any, role: str, db_check_callback=None):
        """
        Broadcast to users of a specific role.
        Note: Since we store user_id, we might need to know the role.
        Simple approach: Client can filter, OR we store (user_id, role) tuple.
        For now, let's just broadcast to provided user_ids if known, 
        or simplest: Broadcast all, let client filter? 
        Better: Broadcast all is fine for 'Job Posted' (public info).
        For 'Application Submitted' (Admin only), we need to know who is admin.
        
        Alternative: Store role in active_connections: Dict[int, Dict['ws': WebSocket, 'role': str]]
        """
        pass

# Global instance
manager = ConnectionManager()
