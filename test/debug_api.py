import requests
import json

API_BASE = "http://35.225.84.173:8045"
API_KEY = "sk-ant2api-7Kx9mPqR4nVwZ3bY8cL1dF6gH2jT5uA"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

def debug_api():
    print("=" * 60)
    print("🔍 DEBUG: Checking API and Token Status")
    print("=" * 60)
    
    # 1. Test Health
    print("\n1️⃣ Health Check:")
    try:
        r = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"   Status: {r.status_code}")
        print(f"   Response: {r.json()}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 2. Test Models List
    print("\n2️⃣ Models List:")
    try:
        r = requests.get(f"{API_BASE}/v1/models", headers=headers, timeout=10)
        print(f"   Status: {r.status_code}")
        if r.status_code == 200:
            models = r.json().get("data", [])
            print(f"   Available models: {len(models)}")
            for m in models[:5]:
                print(f"   - {m['id']}")
            if len(models) > 5:
                print(f"   ... and {len(models)-5} more")
        else:
            print(f"   Response: {r.text[:200]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 3. Test Single Request với full error detail
    print("\n3️⃣ Test Single Chat Request (gemini-2.5-flash):")
    try:
        r = requests.post(
            f"{API_BASE}/v1/chat/completions",
            headers=headers,
            json={
                "model": "gemini-2.5-flash",
                "messages": [{"role": "user", "content": "Say hello"}],
                "max_tokens": 10
            },
            timeout=60
        )
        print(f"   Status: {r.status_code}")
        print(f"   Headers: {dict(r.headers)}")
        print(f"   Response: {json.dumps(r.json(), indent=2)[:500]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Test với model khác
    print("\n4️⃣ Test Single Chat Request (gemini-3-flash):")
    try:
        r = requests.post(
            f"{API_BASE}/v1/chat/completions",
            headers=headers,
            json={
                "model": "gemini-3-flash",
                "messages": [{"role": "user", "content": "Say hi"}],
                "max_tokens": 10
            },
            timeout=60
        )
        print(f"   Status: {r.status_code}")
        print(f"   Response: {json.dumps(r.json(), indent=2)[:500]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 5. Check memory endpoint
    print("\n5️⃣ Memory Status:")
    try:
        r = requests.get(f"{API_BASE}/v1/memory", timeout=10)
        print(f"   Status: {r.status_code}")
        print(f"   Response: {json.dumps(r.json(), indent=2)}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("Debug Complete!")
    print("=" * 60)

if __name__ == "__main__":
    debug_api()
