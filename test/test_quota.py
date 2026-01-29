import requests

API_URL = "http://35.225.84.173:8045/v1/chat/completions"  # Thay bằng VPS IP nếu test từ xa
API_KEY = "sk-ant2api-7Kx9mPqR4nVwZ3bY8cL1dF6gH2jT5uA"  # Thay bằng API key của bạn

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

models_to_test = [
    "gemini-2.5-flash",
    "gemini-2.5-pro", 
    "claude-sonnet-4-5",
    "claude-opus-4-5-thinking"
]

def test_quota():
    print("=" * 50)
    print("Testing API Quota - 3 requests per model")
    print("(Round-robin sẽ rotate qua 3 tokens)")
    print("=" * 50)
    
    for model in models_to_test:
        print(f"\n🔍 Testing model: {model}")
        print("-" * 40)
        
        for i in range(3):  # Test 3 lần để rotate qua 3 tokens
            data = {
                "model": model,
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 10
            }
            
            try:
                response = requests.post(API_URL, headers=headers, json=data, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")[:50]
                    print(f"  ✅ Request {i+1}: OK - {content}...")
                elif response.status_code == 429:
                    error = response.json().get("error", {})
                    print(f"  ❌ Request {i+1}: QUOTA EXHAUSTED")
                else:
                    error = response.json().get("error", {})
                    print(f"  ⚠️ Request {i+1}: Error {response.status_code} - {error.get('message', 'Unknown')[:50]}")
                    
            except requests.exceptions.Timeout:
                print(f"  ⏰ Request {i+1}: Timeout")
            except Exception as e:
                print(f"  💥 Request {i+1}: Exception - {str(e)[:50]}")
    
    print("\n" + "=" * 50)
    print("Test Complete!")
    print("=" * 50)

if __name__ == "__main__":
    test_quota()
