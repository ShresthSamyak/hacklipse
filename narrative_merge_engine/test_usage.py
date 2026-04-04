from openai.types.completion_usage import CompletionUsage
usage = CompletionUsage(completion_tokens=10, prompt_tokens=20, total_tokens=30)
d = dict(usage)
print(type(d))
for k, v in d.items():
    print(k, type(v))

from pydantic import TypeAdapter
try:
    TypeAdapter(dict).dump_python(d)
    print("TypeAdapter serialization worked")
except Exception as e:
    print(f"Exception: {e}")
