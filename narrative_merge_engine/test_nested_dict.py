from pydantic import BaseModel, TypeAdapter
class Foo(BaseModel):
    a: int
class Bar(BaseModel):
    foo: Foo
    
bar = Bar(foo=Foo(a=1))
d = dict(bar)
print(type(d["foo"]))

try:
    TypeAdapter(dict).dump_python(d)
    print("Serialization worked")
except Exception as e:
    print(f"Exception: {type(e).__name__}: {e}")
