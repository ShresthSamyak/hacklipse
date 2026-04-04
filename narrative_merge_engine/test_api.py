import httpx
import asyncio

async def test():
    req = {
        "text": "I was at the corner. Jane was looking the other way. We suddenly heard a crash.",
        "mode": "investigator",
        "demo_mode": True,
        "fast_preview": False
    }
    
    async with httpx.AsyncClient(timeout=120) as client:
        print("Sending request...")
        resp = await client.post("http://127.0.0.1:8000/api/v1/demo/run-text", json=req)
        
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("SUCCESS! Pipeline response received.")
            print("Keys:", list(data.keys()))
        else:
            print("FAILED.")
            print(resp.text)

asyncio.run(test())
