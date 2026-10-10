"""Read-only access to the Yale SOM course catalog (data/yale_som.db)."""

import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "yale_som.db"

SESSIONS = {"fall-1": "Fall 1 (first half)", "fall-2": "Fall 2 (second half)", "fall": "full Fall term"}


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def query(sql: str, params: tuple = ()) -> list[dict]:
    with _connect() as con:
        return [dict(r) for r in con.execute(sql, params)]


def display_name(faculty: str) -> str:
    """'Zaman, Tauhid' -> 'Tauhid Zaman'."""
    last, _, first = faculty.partition(",")
    return f"{first.strip()} {last.strip()}".strip()


def slugify(faculty: str) -> str:
    """'Zaman, Tauhid' -> 'tauhid-zaman'."""
    return re.sub(r"[^a-z0-9]+", "-", display_name(faculty).lower()).strip("-")


def section_line(row: dict) -> str:
    """One compact line describing when and where a section meets."""
    parts = [f"section {row['section']}" if row.get("section") else None]
    parts.append(" ".join((row.get("daytimes") or "").split()) or "schedule TBA")
    parts.append(row.get("room") or "room TBA")
    parts.append(SESSIONS.get(row.get("course_session") or "", row.get("course_session") or ""))
    return ", ".join(p for p in parts if p)


def group_courses(rows: list[dict], describe: bool = False) -> list[dict]:
    """Collapse section rows into one entry per course number + title."""
    out: dict[tuple, dict] = {}
    for r in rows:
        key = (r["course_number"], r["course_title"])
        c = out.setdefault(
            key,
            {
                "course_number": r["course_number"],
                "title": r["course_title"],
                "categories": [],
                "instructors": [],
                "units": r["units"],
                "sections": [],
            },
        )
        if r["course_category"] and r["course_category"] not in c["categories"]:
            c["categories"].append(r["course_category"])
        prof = display_name(r["faculty_1"]) if r["faculty_1"] else None
        if prof and prof not in c["instructors"]:
            c["instructors"].append(prof)
        c["sections"].append(section_line(r))
        if describe:
            c.setdefault("description", " ".join((r["course_description"] or "").split()))
            if r["syllabus"]:
                c.setdefault("syllabus", r["syllabus"])
    return list(out.values())


def all_faculty() -> list[str]:
    """Raw 'Last, First' names of everyone teaching at least one course."""
    return [
        r["faculty_1"]
        for r in query("SELECT DISTINCT faculty_1 FROM courses WHERE coalesce(faculty_1, '') <> '' ORDER BY faculty_1")
    ]


def faculty_rows(faculty: str) -> list[dict]:
    return query("SELECT * FROM courses WHERE faculty_1 = ? ORDER BY course_number, section", (faculty,))
