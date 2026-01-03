import requests

def test_login():
    url = "http://localhost:8000/api/v1/login/access-token"
    data = {
        "username": "student@example.com",
        "password": "password123"
    }
    
    print(f"Testing Root API: http://localhost:8000/")
    try:
        resp = requests.get("http://localhost:8000/")
        print(f"Root Status: {resp.status_code}")
        print(f"Root Response: {resp.text}")
    except Exception as e:
        print(f"Root Error: {e}")

    print(f"Testing login API: {url}")
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
