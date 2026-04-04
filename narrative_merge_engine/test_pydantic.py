from app.api.v1.endpoints.demo import PipelineResponse, _to_response
from app.services.demo_pipeline import PipelineResult
from app.models.schemas.report import ReportGenerationResult
from app.models.schemas.conflict_strict import StrictConflictResult

r = PipelineResult()
r.report = ReportGenerationResult.fallback().model_dump()
r.conflicts = StrictConflictResult().model_dump()
d = r.to_dict()

print("Dict created")
try:
    resp = PipelineResponse(**d)
    print("Response object created")
    print(resp.model_dump())
except Exception as e:
    print(f"Error: {e}")
