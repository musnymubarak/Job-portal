import psycopg2
from psycopg2 import OperationalError

def create_database_if_not_exists():
    # Connect to default 'postgres' database to check/create target db
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="password",
            host="localhost",
            port="5432"
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'internship_db'")
        exists = cursor.fetchone()
        
        if not exists:
            print("Database 'internship_db' does not exist. Creating...")
            cursor.execute("CREATE DATABASE internship_db")
            print("Database 'internship_db' created successfully.")
        else:
            print("Database 'internship_db' already exists.")
            
        cursor.close()
        conn.close()
        return True
    except OperationalError as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    if create_database_if_not_exists():
        print("Connection verification successful.")
    else:
        print("Connection verification failed.")
