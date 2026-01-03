from app.api.deps import get_db
from app.db.session import SessionLocal
from sqlalchemy import text

def test_db_connection():
    print("Testing DB Connection...")
    try:
        # Test SessionLocal creation directly
        db = SessionLocal()
        print("SessionLocal created successfully.")
        
        # Test executing a simple query
        result = db.execute(text("SELECT 1"))
        print(f"Query Result: {result.scalar()}")
        
        db.close()
        print("DB Connection Valid.")
    except Exception as e:
        print(f"DB Connection FAILED: {e}")
        import traceback
        traceback.print_exc()

def test_get_db_generator():
    print("\nTesting get_db generator...")
    try:
        gen = get_db()
        db = next(gen)
        print("get_db() yielded a session.")
        db.close()
        print("get_db() worked.")
    except Exception as e:
        print(f"get_db FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_db_connection()
    test_get_db_generator()
