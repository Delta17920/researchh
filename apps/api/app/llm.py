import os
import json
from groq import Groq
from pydantic import BaseModel

# We will set the API key via environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MODEL_NAME = "openai/gpt-oss-20b" # Powerful reasoning model on Groq

def get_llm_client() -> Groq | None:
    if not GROQ_API_KEY:
        return None
    return Groq(api_key=GROQ_API_KEY)

def generate_structured(prompt: str, response_model: type[BaseModel], system_prompt: str = "You are an expert policy analysis AI. Return your response in JSON format matching the requested schema.") -> BaseModel | None:
    client = get_llm_client()
    if not client:
        return None
    
    # Inject the schema into the system prompt for Groq JSON mode
    schema = response_model.model_json_schema()
    full_system = f"{system_prompt}\n\nCRITICAL: Output ONLY a JSON object that provides values for this schema. DO NOT output the schema itself. Schema: {json.dumps(schema)}"

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": full_system},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = response.choices[0].message.content
        return response_model.model_validate_json(content)
    except Exception as e:
        print(f"Groq structured generation failed: {e}")
        return None

def generate_text(prompt: str, system_prompt: str = "You are an expert policy analysis AI.") -> str | None:
    client = get_llm_client()
    if not client:
        return None
        
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.4
    )
    return response.choices[0].message.content
