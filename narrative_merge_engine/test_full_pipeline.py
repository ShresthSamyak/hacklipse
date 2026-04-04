import asyncio
from app.api.v1.endpoints.demo import _to_response
from app.services.demo_pipeline import build_pipeline, PipelineMode
from app.core.ai.orchestrator import LLMOrchestrator
from pydantic import TypeAdapter
import json

async def run():
    class MockSession: pass
    
    # We must mock STT if audio was used, but we'll use text extraction.
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
    
    print("Pipeline FINISHED. Status:", result.status)
    try:
        resp = _to_response(result)
        from fastapi.encoders import jsonable_encoder
        encoded = jsonable_encoder(resp)
        print("FastAPI jsonable_encoder succeeded!")
    except Exception as e:
        print("Serialization Error!")
        import traceback
        traceback.print_exc()

asyncio.run(run())
