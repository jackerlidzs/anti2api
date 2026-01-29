import requests
import json

API_URL = "http://35.225.84.173:8045/v1/chat/completions"
API_KEY = "sk-ant2api-7Kx9mPqR4nVwZ3bY8cL1dF6gH2jT5uA"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

# Get all models first
print("Fetching models...")
r = requests.get("http://35.225.84.173:8045/v1/models", headers=headers, timeout=10)
models = [m["id"] for m in r.json().get("data", [])]
print(f"Found {len(models)} models\n")

print("=" * 50)
print("Testing ALL models")
print("=" * 50)

working = []
failed = []

for model in models:
    try:
        r = requests.post(API_URL, headers=headers, json={
            "model": model,
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 5
        }, timeout=30)
        
        if r.status_code == 200:
            print(f"✅ {model}")
            working.append(model)
        else:
            error = r.json().get("error", {})
            code = error.get("code", r.status_code)
            print(f"❌ {model} - {code}")
            failed.append((model, code))
    except Exception as e:
        print(f"💥 {model} - {str(e)[:30]}")
        failed.append((model, "exception"))

print("\n" + "=" * 50)
print(f"Working: {len(working)} | Failed: {len(failed)}")
print("=" * 50)

if working:
    print("\n🎉 Working models:")
    for m in working:
        print(f"  - {m}")
