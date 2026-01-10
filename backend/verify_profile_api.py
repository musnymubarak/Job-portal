import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "2020ict001@stu.vau.ac.lk"
PASSWORD = "password123"

def login():
    url = f"{BASE_URL}/login/access-token"
    data = {
        "username": EMAIL,
        "password": PASSWORD
    }
    response = requests.post(url, data=data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    return response.json()["access_token"]

def verify_profile_flow():
    token = login()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Check if profile exists (might be 404)
    print("1. Checking existing profile...")
    resp = requests.get(f"{BASE_URL}/student-profile/me", headers=headers)
    print(f"   Status: {resp.status_code}")
    
    # 2. Create Profile
    print("\n2. Creating profile...")
    profile_data = {
        "github_url": "https://github.com/student001",
        "linkedin_url": "https://linkedin.com/in/student001",
        "portfolio_url": "https://student001.com",
        "projects": [
            {
                "title": "Project Alpha",
                "description": "A cool project",
                "link": "https://github.com/student001/alpha"
            }
        ],
        "skills": [
            {
                "name": "Python",
                "level": "intermediate"
            },
            {
                "name": "FastAPI",
                "level": "beginner"
            }
        ]
    }
    
    # If it already exists (from previous run), we might get 400, so handle that
    if resp.status_code == 404:
        resp = requests.post(f"{BASE_URL}/student-profile/", headers=headers, json=profile_data)
        print(f"   Create Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"   Created: {resp.json()['id']}")
        else:
            print(f"   Error: {resp.text}")
    else:
        print("   Profile already exists, skipping create.")

    # 3. Get Profile
    print("\n3. Getting profile...")
    resp = requests.get(f"{BASE_URL}/student-profile/me", headers=headers)
    print(f"   Get Status: {resp.status_code}")
    data = resp.json()
    print(f"   Data: GitHub={data.get('github_url')}, Skills={len(data.get('skills', []))}, Projects={len(data.get('projects', []))}")

    # 4. Update Profile
    print("\n4. Updating profile...")
    update_data = {
        "github_url": "https://github.com/student001-updated",
        "skills": [
            {
                "name": "Python",
                "level": "advanced"
            }
        ]
    }
    resp = requests.put(f"{BASE_URL}/student-profile/me", headers=headers, json=update_data)
    print(f"   Update Status: {resp.status_code}")
    
    # 5. Verify Update
    print("\n5. Verifying update...")
    resp = requests.get(f"{BASE_URL}/student-profile/me", headers=headers)
    data = resp.json()
    print(f"   New GitHub: {data.get('github_url')}")
    print(f"   New Skills: {len(data.get('skills', []))} (Should be 1)")
    print(f"   New Skill Name: {data['skills'][0]['name']} Level: {data['skills'][0]['level']}")

if __name__ == "__main__":
    verify_profile_flow()
