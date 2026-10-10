"""FastAPI backend for Yale SOM Virtual: chat with AI professors.

Run from this folder:  .venv/bin/python -m uvicorn main:app --port 8000
"""

import os
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(HERE.parent / ".env")
load_dotenv(HERE / ".env", override=True)  # backend/.env wins over anything already in the environment
os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from pydantic_ai.exceptions import ModelHTTPError  # noqa: E402

from agents import MissingAPIKey, build_prompt, get_agent, get_model, professors  # noqa: E402

MAX_TURNS = 20  # turns of history kept per conversation

app = FastAPI(title="Yale SOM Virtual backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# (professor slug, session id) -> one list of model messages per turn
conversations: dict[tuple[str, str], list[list]] = defaultdict(list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="default", max_length=100)


class ChatReply(BaseModel):
    professor: str
    reply: str
    tools_used: list[str]


def _professor(slug: str):
    p = professors().get(slug)
    if not p:
        raise HTTPException(404, f"No professor '{slug}'. See /api/professors for the list.")
    return p


@app.get("/api/health")
def health():
    try:
        get_model()
        key = True
    except MissingAPIKey:
        key = False
    return {"ok": True, "professors": len(professors()), "api_key_loaded": key}


@app.get("/api/professors")
def list_professors():
    return [p.summary() for p in professors().values()]


@app.get("/api/professors/{slug}")
def get_professor(slug: str):
    p = _professor(slug)
    return {**p.summary(), "bio": p.bio, "prompt": build_prompt(p)}


@app.post("/api/professors/{slug}/chat", response_model=ChatReply)
async def chat(slug: str, req: ChatRequest):
    p = _professor(slug)
    try:
        agent = get_agent(slug)
    except MissingAPIKey as e:
        raise HTTPException(503, str(e))
    turns = conversations[(slug, req.session_id)]
    history = [m for turn in turns for m in turn]
    try:
        result = await agent.run(req.message, message_history=history)
    except ModelHTTPError as e:
        raise HTTPException(502, f"The model call failed ({e.status_code}): {e.body or e.message}")
    new = result.new_messages()
    turns.append(new)
    del turns[:-MAX_TURNS]
    tools_used = [part.tool_name for m in new for part in m.parts if part.part_kind == "tool-call"]
    return ChatReply(professor=p.name, reply=result.output, tools_used=tools_used)


@app.delete("/api/professors/{slug}/chat/{session_id}")
def reset_chat(slug: str, session_id: str):
    conversations.pop((slug, session_id), None)
    return {"ok": True}
