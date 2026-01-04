from app.db.session import SessionLocal
from app.models.job import Job
from app.models.user import User

def test_jobs():
    db = SessionLocal()
    try:
        print("Testing Job Query...")
        jobs = db.query(Job).all()
        print(f"Found {len(jobs)} jobs.")
        for job in jobs:
            print(f"Job: {job.title}, Posted by: {job.admin.email if job.admin else 'Unknown'}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_jobs()
