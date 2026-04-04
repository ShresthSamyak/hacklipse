from app.services.demo_pipeline import PipelineResult
from app.models.schemas.report import ReportGenerationResult
from app.models.schemas.conflict_strict import StrictConflictResult
import json

r = PipelineResult()
r.report = ReportGenerationResult.fallback().model_dump()
r.conflicts = StrictConflictResult().model_dump()
d = r.to_dict()

for k, v in d.items():
    try:
        json.dumps(v)
    except Exception as e:
        print(f"Error on {k}: {e} (type {type(v)})")
