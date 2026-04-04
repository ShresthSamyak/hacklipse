from openai.types.completion_usage import CompletionUsage
from pydantic import BaseModel
usage = CompletionUsage(completion_tokens=10, prompt_tokens=20, total_tokens=30)
print(isinstance(usage, BaseModel))
