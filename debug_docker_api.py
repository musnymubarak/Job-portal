import requests
import sys

BASE_URL = "http://127.0.0.1/api/v1"

def test_endpoint(name, method, endpoint, payload=None, auth=None):
    url = f"{BASE_URL}{endpoint}"
    print(f"\n--- Testing {name} [{method} {endpoint}] ---")
    try:
        headers = {}
        if auth:
            headers['Authorization'] = f"Bearer {auth}"
            
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, json=payload, headers=headers)
        elif method == 'POST_FORM':
             response = requests.post(url, data=payload, headers=headers)
            
        print(f"Status: {response.status_code}")
        if response.status_code >= 400:
            print(f"Error Response: {response.text[:500]}") # Print first 500 chars of error
        else:
            print("Success!")
            return response.json()
    except Exception as e:
        print(f"FAILED: {e}")
    return None

def run_tests():
    # 1. Test Root/Health
    print("Checking API Health...")
    try:
        r = requests.get("http://127.0.0.1/api/v1/")
        print(f"Root Status: {r.status_code}")
    except:
        print("Could not connect to localhost/api/v1/. Is Docker running?")
        return

    # 2. Login (This is where user got 500)
    print("\nAttempting Login...")
    # Replace with known valid credentials if available, or try default seed ones
    login_data = {
        "username": "admin@example.com", 
        "password": "adminpassword" 
    }
    # Note: OAuth2PasswordRequestForm expects form data, not JSON
    login_res = test_endpoint("Admin Login", "POST_FORM", "/login/access-token", login_data)
    
    token = None
    if login_res and 'access_token' in login_res:
        token = login_res['access_token']
        print(f"Got Token: {token[:10]}...")
    
    # 3. Public Jobs
    test_endpoint("Public Jobs", "GET", "/jobs/")

    # 4. Protected Route (needs token)
    if token:
        test_endpoint("Me (Profile)", "GET", "/users/me", auth=token)
    else:
        print("\nSkipping protected tests (No Token)")

if __name__ == "__main__":
    run_tests()
