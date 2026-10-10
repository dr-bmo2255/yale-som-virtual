"""Catalog lookup tools shared by every professor agent."""

import re

from db import display_name, group_courses, query

_STOP = {"the", "a", "an", "of", "and", "or", "for", "in", "on", "to", "is", "are", "who", "what", "teach", "teaches", "taught", "class", "classes", "course", "courses", "about", "any", "there", "som", "yale"}


def _name_like(name: str) -> tuple[str, tuple]:
    """Match a professor by any of the words in their name, in either order."""
    words = [w for w in re.findall(r"[A-Za-z'-]+", name) if w.lower() not in {"prof", "professor", "dr"}]
    if not words:
        return "0", ()
    return " AND ".join("faculty_1 LIKE ?" for _ in words), tuple(f"%{w}%" for w in words)


def search_courses(query_text: str, limit: int = 8) -> list[dict] | str:
    """Search the Yale SOM Fall 2026 course catalog by keyword.

    Matches course numbers, titles, categories, descriptions and instructor names.
    Use this for questions like "is there a class on pricing?" or "what AI courses are offered?".

    Args:
        query_text: Keywords to look for, e.g. "negotiation", "machine learning", "MGT 541".
        limit: Maximum number of courses to return.
    """
    terms = [t for t in re.findall(r"[A-Za-z0-9]+", query_text.lower()) if t not in _STOP]
    if not terms:
        return "Give me at least one keyword to search for."
    # whole-word prefix match, so "AI" finds "AI Applications" but not "Financial"
    pats = [re.compile(rf"\b{re.escape(t)}", re.I) for t in terms]
    scored = []
    for r in query("SELECT * FROM courses ORDER BY course_number, section"):
        number = (r["course_number"] or "") + " " + (r["course_number"] or "").replace(" ", "")
        score = 0
        for pat in pats:
            score += 3 * bool(pat.search(r["course_title"] or "")) + 3 * bool(pat.search(number))
            score += 2 * bool(pat.search(r["course_category"] or "")) + 2 * bool(pat.search(r["faculty_1"] or ""))
            score += bool(pat.search(r["course_description"] or ""))
        if score:
            scored.append((score, r))
    scored.sort(key=lambda x: -x[0])
    courses = group_courses([r for _, r in scored])[: max(1, min(limit, 20))]
    return courses or f"No courses matched '{query_text}'."


def get_course_details(course_number: str) -> list[dict] | str:
    """Get the full catalog entry for a course: description, instructor, every section's schedule and room, units and syllabus link.

    Args:
        course_number: The course number, e.g. "MGT 409" or "MGMT 7403".
    """
    key = re.sub(r"\s+", "", course_number).upper()
    rows = query("SELECT * FROM courses WHERE upper(replace(course_number, ' ', '')) = ? ORDER BY section", (key,))
    return group_courses(rows, describe=True) or f"No course numbered '{course_number}' in the Fall 2026 catalog."


def find_courses_by_professor(professor_name: str) -> list[dict] | str:
    """List every course a given professor teaches this term, with schedules and rooms.

    Args:
        professor_name: Full or partial name, e.g. "Zaman", "Barbara Biasi".
    """
    where, params = _name_like(professor_name)
    rows = query(f"SELECT * FROM courses WHERE {where} ORDER BY course_number, section", params)
    return group_courses(rows) or f"Nobody named '{professor_name}' is teaching this term."


def get_professor_bio(professor_name: str) -> list[dict] | str:
    """Look up a colleague's faculty bio (background, research interests, what they teach).

    Args:
        professor_name: Full or partial name, e.g. "Sudhir", "Kevin Williams".
    """
    where, params = _name_like(professor_name)
    rows = query(f"SELECT DISTINCT faculty_1, faculty_bio FROM courses WHERE {where} AND coalesce(faculty_bio, '') <> ''", params)
    return [{"name": display_name(r["faculty_1"]), "bio": r["faculty_bio"]} for r in rows[:3]] or f"No bio on file for '{professor_name}'."


def find_courses_in_room(room: str) -> list[dict] | str:
    """List what is taught in a given room, e.g. to answer "what's in Evans 2200?".

    Args:
        room: Room name or number, e.g. "2200" or "EVANS 4430".
    """
    rows = query("SELECT * FROM courses WHERE room LIKE ? ORDER BY timings_day, timings_start", (f"%{room.strip()}%",))
    return group_courses(rows) or f"Nothing is scheduled in '{room}'."


def list_course_categories() -> list[dict]:
    """List every course category (Core, Finance, Marketing, EMBA, ...) with how many sections each has."""
    return query("SELECT course_category AS category, count(*) AS sections FROM courses WHERE coalesce(course_category, '') <> '' GROUP BY 1 ORDER BY 2 DESC")


def find_courses_by_category(category: str) -> list[dict] | str:
    """List the courses in a category.

    Args:
        category: Category name or part of it, e.g. "Finance", "Core", "Artificial Intelligence".
    """
    rows = query("SELECT * FROM courses WHERE course_category LIKE ? ORDER BY course_number, section", (f"%{category.strip()}%",))
    return group_courses(rows)[:40] or f"No category matching '{category}'. Call list_course_categories to see the options."


CATALOG_TOOLS = [
    search_courses,
    get_course_details,
    find_courses_by_professor,
    get_professor_bio,
    find_courses_in_room,
    list_course_categories,
    find_courses_by_category,
]
