import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    resp = requests.post(f"{BASE_URL}/login/access-token", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed for {email}: {resp.text}")
        return None
    return resp.json()["access_token"]

def run_test():
    # 1. Login Admin
    print("Logging in Admin...")
    admin_token = login("admin@example.com", "password123")
    if not admin_token: return

    # 2. Post a Job (Admin)
    print("Posting Job...")
    job_data = {
        "title": "Software Engineer Intern",
        "description": "We are looking for a Python enthusiast.",
        "requirements": "Python, FastAPI, React"
    }
    resp = requests.post(
        f"{BASE_URL}/jobs/", 
        headers={"Authorization": f"Bearer {admin_token}"},
        json=job_data
    )
    print(f"Post Job Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Error: {resp.text}")
        return
    job_id = resp.json()["id"]
    print(f"Job Created: ID {job_id}")

    # 3. Login Student
    print("Logging in Student...")
    student_token = login("student@example.com", "password123")
    if not student_token: return

    # 4. Upload CV (Student)
    print("Uploading CV...")
    # Create a dummy PDF file
    with open("dummy_cv.pdf", "wb") as f:
        f.write(b"%PDF-1.4 dummy conent")
    
    files = {"file": ("dummy_cv.pdf", open("dummy_cv.pdf", "rb"), "application/pdf")}
    resp = requests.post(
        f"{BASE_URL}/users/upload-cv",
        headers={"Authorization": f"Bearer {student_token}"},
        files=files
    )
    print(f"Upload CV Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Error: {resp.text}")

    # 5. Apply for Job (Student)
    print("Applying for Job...")
    resp = requests.post(
        f"{BASE_URL}/applications/{job_id}/apply",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    print(f"Apply Status: {resp.status_code}")
    print(f"Application Response: {resp.text}")

    # 6. Check Applications (Admin)
    print("Checking Applications (Admin)...")
    resp = requests.get(
        f"{BASE_URL}/applications/admin/list",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    print(f"Admin List Status: {resp.status_code}")
    print(f"Applications: {resp.text}")

if __name__ == "__main__":
    run_test()
