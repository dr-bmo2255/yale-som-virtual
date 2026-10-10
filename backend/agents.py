"""Every Yale SOM professor in the catalog is a Pydantic AI agent.

Each agent's prompt is built from that professor's rows in the database (bio, courses, schedule,
rooms) plus a speaking style from styles.py. All agents share the catalog lookup tools.
"""

import os
from dataclasses import dataclass
from functools import lru_cache

from openai import AsyncOpenAI
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel, OpenAIChatModelSettings
from pydantic_ai.providers.openai import OpenAIProvider

import db
from styles import facts_for, style_for
from tools import CATALOG_TOOLS

PORTKEY_BASE_URL = "https://api.portkey.ai/v1"
MODEL_NAME = "gpt-6-luna"


class MissingAPIKey(RuntimeError):
    pass


def _env(name: str) -> str | None:
    """Case-insensitive env lookup, so PortKey_API_key and PORTKEY_API_KEY both work."""
    for k, v in os.environ.items():
        if k.upper() == name and v.strip():
            return v.strip()
    return None


@lru_cache(maxsize=1)
def get_model() -> OpenAIChatModel:
    """OpenAI gpt-6-luna, routed through the Portkey gateway."""
    key = _env("PORTKEY_API_KEY")
    if not key:
        raise MissingAPIKey("PORTKEY_API_KEY is not set. Put it in backend/.env (see backend/env.example).")
    headers = {"x-portkey-api-key": key}
    virtual_key = _env("PORTKEY_VIRTUAL_KEY")
    config = _env("PORTKEY_CONFIG")
    if virtual_key:
        headers["x-portkey-virtual-key"] = virtual_key
    if config:
        headers["x-portkey-config"] = config
    # the Portkey key carries its own default provider, so the plain model name is enough;
    # set PORTKEY_MODEL to "@<provider-slug>/<model>" if your workspace needs one
    model = _env("PORTKEY_MODEL") or MODEL_NAME
    client = AsyncOpenAI(base_url=_env("PORTKEY_BASE_URL") or PORTKEY_BASE_URL, api_key=key, default_headers=headers)
    # gpt-6-luna only accepts function tools on chat completions with reasoning effort off
    settings = OpenAIChatModelSettings(openai_reasoning_effort="none")
    return OpenAIChatModel(model, provider=OpenAIProvider(openai_client=client), settings=settings)


@dataclass(frozen=True)
class Professor:
    slug: str
    faculty: str  # as stored in the database: 'Last, First'
    name: str
    bio: str
    courses: list[dict]
    rooms: list[str]

    def summary(self) -> dict:
        return {
            "slug": self.slug,
            "name": self.name,
            "rooms": self.rooms,
            "courses": [{"course_number": c["course_number"], "title": c["title"]} for c in self.courses],
        }


@lru_cache(maxsize=1)
def professors() -> dict[str, Professor]:
    out = {}
    for faculty in db.all_faculty():
        rows = db.faculty_rows(faculty)
        slug = db.slugify(faculty)
        out[slug] = Professor(
            slug=slug,
            faculty=faculty,
            name=db.display_name(faculty),
            bio=next((r["faculty_bio"] for r in rows if r["faculty_bio"]), ""),
            courses=db.group_courses(rows, describe=True),
            rooms=sorted({r["room"] for r in rows if r["room"]}),
        )
    return out


KNOWLEDGE = """\
You are an AI version of this professor, so on top of your own field you have complete command of the
quantitative material taught across the Yale SOM curriculum and can teach any of it from first
principles, with a worked numeric example when that helps:
- probability and statistics: random variables, expectation, variance and standard deviation,
  covariance and correlation, the normal distribution, the law of large numbers, the central limit
  theorem, sampling distributions, standard errors, confidence intervals, hypothesis tests, p-values,
  Bayes' rule
- regression: simple and multiple linear regression, least squares, interpreting coefficients,
  R-squared, residuals, t-stats, omitted variable bias, multicollinearity, logistic regression,
  overfitting and train/test splits
- the core MBA toolkit: economics, accounting, finance, operations, marketing, negotiation
- AI: machine learning basics, neural networks, large language models, prompting, and AI agents"""

RULES = """\
How to answer:
- Stay in character as the professor at all times. You are chatting with a student who walked up to
  you in your classroom in Evans Hall.
- Keep it conversational and short: 2 to 5 sentences unless the student asks you to go deep.
- Write plain text only. No markdown, no bullet symbols, no headings, no LaTeX. Write formulas inline
  in plain characters, like Var(X) = E[X^2] - (E[X])^2.
- Your own courses are listed above, so answer questions about them directly.
- For anything about other courses, other professors, rooms, schedules or what is offered, look it up
  with your catalog tools before answering. Never invent a course, instructor, time or room. If the
  catalog has no answer, say so.
- The catalog covers Fall 2026 at Yale SOM only."""


def _course_block(c: dict) -> str:
    lines = [f"{c['course_number']}: {c['title']} ({c['units']} units; {', '.join(c['categories']) or 'uncategorized'})"]
    if c.get("description"):
        lines.append(f"  Description: {c['description']}")
    lines += [f"  Meets: {s}" for s in c["sections"]]
    return "\n".join(lines)


def build_prompt(p: Professor) -> str:
    courses = "\n\n".join(_course_block(c) for c in p.courses) or "No courses on file this term."
    parts = [
        f"You are Professor {p.name} of the Yale School of Management, teaching in Fall 2026.",
        f"About you:\n{p.bio or 'No bio on file.'}",
        facts_for(p.slug),
        f"The courses you teach this term:\n{courses}",
        KNOWLEDGE,
        f"Your speaking style:\n{style_for(p.slug)}",
        RULES,
    ]
    return "\n\n".join(x for x in parts if x)


@lru_cache(maxsize=None)
def get_agent(slug: str) -> Agent:
    p = professors()[slug]
    return Agent(get_model(), name=slug, instructions=build_prompt(p), tools=CATALOG_TOOLS)
