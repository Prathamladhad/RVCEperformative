import asyncio
from models import PipelineState
from storage import set_job

async def seed():
    state = PipelineState(
        job_id="test-job-123",
        subject="science",
        class_level=6,
        board="NCERT"
    )
    state.transformed_chunks = [
        {
            "text": "Photosynthesis is how plants make food using sunlight.",
            "simplified": "Photosynthesis is how plants make food. They use sunlight.",
            "sentences": ["Photosynthesis is how plants make food.", "They use sunlight."],
            "glossary": {"Photosynthesis": "how plants make food using sunlight"},
            "chunk_id": 1
        }
    ]
    state.html_output = "<h1>Test Chapter</h1><p>Photosynthesis is how plants make food. They use sunlight.</p>"
    await set_job("test-job-123", state)
    print("SUCCESS: Mock job seeded in storage.")

if __name__ == "__main__":
    asyncio.run(seed())
