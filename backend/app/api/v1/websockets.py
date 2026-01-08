from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.manager import manager
from app.core.config import settings
from app.core import security
from app.db.session import SessionLocal
from app.models.user import User

router = APIRouter()

async def get_current_user_ws(token: str, db: Session):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
        
    user = db.query(User).filter(User.id == user_id).first()
    return user

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Create a new session for this connection (since it's async and outside normal dependency injection scope mostly)
    # However, 'deps.get_db' yields, which is tricky in WS. 
    # Better to use SessionLocal() directly or just trust the token sub if we only need ID.
    # To be safe, let's verify user exists.
    
    db = SessionLocal()
    try:
        user = await get_current_user_ws(token, db)
        if not user:
            await websocket.close(code=4003) # Forbidden
            return

        await manager.connect(websocket, user.id)
        
        # Determine role for targeted messaging later?
        # For now, we just track by user_id.

        try:
            while True:
                data = await websocket.receive_text()
                # We can handle client messages here (e.g., "ping")
                # await manager.send_personal_message(f"You wrote: {data}", user.id)
                pass
        except WebSocketDisconnect:
            manager.disconnect(websocket, user.id)
    finally:
        db.close()
