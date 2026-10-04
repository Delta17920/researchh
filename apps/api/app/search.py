import os
from tavily import TavilyClient

# We will read this from the environment
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")

def get_tavily_client() -> TavilyClient | None:
    if not TAVILY_API_KEY:
        return None
    return TavilyClient(api_key=TAVILY_API_KEY)

def search_evidence(query: str, search_depth: str = "advanced") -> str:
    """Searches the web for policy evidence using Tavily."""
    client = get_tavily_client()
    if not client:
        return f"TAVILY SEARCH UNAVAILABLE (No API Key). Attempted query: {query}"
    
    try:
        response = client.search(
            query=query, 
            search_depth=search_depth, 
            max_results=3,
            include_answer=True
        )
        return {
            "summary": response.get("answer", ""),
            "results": [{"title": r.get("title"), "url": r.get("url"), "content": r.get("content")} for r in response.get("results", [])]
        }
    except Exception as e:
        print(f"Tavily search failed: {e}")
        return {"summary": f"Error: {e}", "results": []}
