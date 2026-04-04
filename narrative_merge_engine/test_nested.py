import asyncio
from app.api.v1.endpoints.demo import _to_response
from app.services.demo_pipeline import build_pipeline, PipelineMode
from app.core.ai.orchestrator import LLMOrchestrator
from pydantic import BaseModel
import json

def find_basemodels(obj, path=""):
    if isinstance(obj, BaseModel):
        print(f"FOUND BaseModel at {path}: {type(obj)}")
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            find_basemodels(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            find_basemodels(item, f"{path}[{i}]")

async def run():
    class MockSession: pass
    llm = LLMOrchestrator()
    pipeline = build_pipeline(MockSession(), llm, None)
    text = "I entered the building around 8:50 PM. I heard loud voices from upstairs, like people arguing. Around 9 PM, I saw someone quickly running down the stairs."
    
    result = await pipeline.run(
        text=text,
        audio=None,
        mode=PipelineMode.INVESTIGATOR,
        demo_mode=True,
        fast_preview=False,
    )
    
    resp = _to_response(result)
    print("Checking resp for nested BaseModels...")
    find_basemodels(resp.model_dump(), "resp")
    print("Done")

asyncio.run(run())
