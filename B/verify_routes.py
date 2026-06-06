import asyncio
from test_setup import seed
from main import status, result_structured

async def test_endpoints():
    # Seed the store
    await seed()
    
    print("\n--- Direct Call: status('test-job-123') ---")
    try:
        status_response = await status("test-job-123")
        print("Status Code/Result:", status_response)
    except Exception as e:
        print("Status Error:", str(e))
        import traceback
        traceback.print_exc()
        
    print("\n--- Direct Call: result_structured('test-job-123') ---")
    try:
        result_response = await result_structured("test-job-123")
        print("Result Object:", result_response)
        # Convert to dict to test Pydantic serialization
        print("Serialized JSON Dict:")
        import json
        # Handle Pydantic v1 vs v2 dict conversion
        if hasattr(result_response, "model_dump"):
            print(json.dumps(result_response.model_dump(), indent=2))
        else:
            print(json.dumps(result_response.dict(), indent=2))
    except Exception as e:
        print("Result Error:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_endpoints())
