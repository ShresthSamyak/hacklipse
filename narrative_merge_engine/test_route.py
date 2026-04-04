import asyncio
from app.api.v1.endpoints.demo import run_text_demo, TextRunRequest, PipelineResponse
from app.api.deps import AppConfig, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from pydantic import TypeAdapter
import json

async def run():
    req = TextRunRequest(
        text="I entered the building around 8:50 PM. I heard loud voices from upstairs, like people arguing. Around 9 PM, I saw someone quickly running down the stairs.",
        mode="investigator",
        demo_mode=True,
        fast_preview=False
    )
    class MockSession: pass

    try:
        resp = await run_text_demo(request=req, db=MockSession(), stt=None)
        print("Success evaluating pipeline!")
        try:
            ta = TypeAdapter(PipelineResponse)
            python_dict = ta.dump_python(resp)
            json_bytes = ta.dump_json(resp)
            print("Pydantic dumped JSON successfully!")
        except Exception as ser_err:
            print("Serialization error:")
            import traceback
            traceback.print_exc()
    except Exception as e:
        print("Error inside run_text_demo:", e)

asyncio.run(run())
