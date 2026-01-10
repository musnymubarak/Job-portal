from sqlalchemy import text
from app.db.session import SessionLocal

def fix_alembic():
    db = SessionLocal()
    try:
        # Check if table exists
        db.execute(text("DELETE FROM alembic_version"))
        db.commit()
        print("Successfully cleared alembic_version table.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_alembic()
