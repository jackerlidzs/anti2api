from openai import OpenAI

# Kết nối đến local server
client = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-449f3fbaf7604ad6a182b8e301db2991"
)

# Lấy danh sách models
print("Fetching models...")
models_response = client.models.list()
models = [m.id for m in models_response.data]
print(f"Found {len(models)} models\n")

print("=" * 60)
print("Testing ALL models from LOCAL")
print("=" * 60)

working = []
failed = []

for model in models:
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=5
        )
        content = response.choices[0].message.content[:30] if response.choices else "No content"
        print(f"✅ {model} - {content}...")
        working.append(model)
    except Exception as e:
        error_msg = str(e)[:50]
        if "429" in error_msg or "quota" in error_msg.lower():
            print(f"❌ {model} - QUOTA EXHAUSTED")
        elif "503" in error_msg:
            print(f"⚠️ {model} - NO CAPACITY")
        else:
            print(f"💥 {model} - {error_msg}")
        failed.append(model)

print("\n" + "=" * 60)
print(f"✅ Working: {len(working)} | ❌ Failed: {len(failed)}")
print("=" * 60)

if working:
    print("\n🎉 Working models:")
    for m in working:
        print(f"  - {m}")
