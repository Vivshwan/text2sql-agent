from groq import Groq
from ..config import GROQ_API_KEY, GOOGLE_API_KEY, LLM_MODEL

_groq = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def _call_groq(prompt: str, system: str) -> str:
    resp = _groq.chat.completions.create(
        model=LLM_MODEL,
        temperature=0,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content.strip()

def complete(prompt: str, system: str = "You are a careful SQLite expert.") -> str:
    if not _groq:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file.")
    try:
        return _call_groq(prompt, system)
    except Exception as e:
        # This will print the REAL error to your terminal so we know what's wrong
        print(f"\n❌ GROQ API ERROR: {str(e)}\n")
        raise RuntimeError(f"Groq API failed: {str(e)}")