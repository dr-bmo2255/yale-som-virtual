# Yale SOM Virtual: Evans Hall, Floor 2

A first-person walk-through of the 2nd floor of Edward P. Evans Hall (Yale School of Management), built with React, Vite, three.js, and @react-three/fiber.

It includes the blue classroom drums you can walk into, the curvy glass cloister around the courtyard, Ross Library on the west side, the Beinecke Terrace Room and its outdoor terrace on the east side, the small glass meeting rooms, and paintings above the stairwells.

**Walk it in your browser:** https://zlisto.github.io/yale_som_virtual/

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Click to walk in**.

**Keyboard + mouse** (works like a PC shooter):

| Key | Action |
| --- | --- |
| W A S D / arrows | walk |
| Mouse | look |
| Shift | sprint |
| Space | jump |
| C | crouch |
| M | toggle map |
| Esc | pause |

**Phone / tablet:** tap **Tap to walk in**. The left-thumb joystick walks (push it all the way to sprint), dragging anywhere else looks around, and there are on-screen jump and pause buttons. On a laptop, click **Use on-screen joystick** to try the phone controls. WASD still works in that mode.

## AI professors (backend)

`backend/` is a FastAPI app where every professor in `data/yale_som.db` is a [Pydantic AI](https://ai.pydantic.dev) agent. Each agent's prompt is built from the database (bio, courses, schedule, room) plus a speaking style in `backend/styles.py`, and all of them share tools that search the course catalog (`backend/tools.py`). The model is OpenAI `gpt-6-luna`, called through Portkey.

```bash
cd backend
uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt
cp env.example .env   # then paste your Portkey key into .env (git-ignored)
.venv/bin/python -m uvicorn main:app --port 8000
```

`npm run dev` proxies `/api` to port 8000. Endpoints: `GET /api/professors`, `GET /api/professors/{slug}`, `POST /api/professors/{slug}/chat` with `{"message": "...", "session_id": "..."}`. The GitHub Pages site is static, so chat only works when the backend is running locally.

## How it's built

- `src/layout.js`: the floor plan in meters (+x east, -z north). It holds the drums, library, Beinecke, stairs, meeting rooms, wall colliders, and room lookup. Each classroom faces the courtyard, with the whiteboard and podium on the inner side and stadium-seating rows (32 cm risers) stepping up toward the outer wall; its two doors are at the front corners. You climb the center-aisle steps one riser at a time.
- `src/World.jsx`: all the meshes. Walls use instanced boxes and the drums use partial cylinders.
- `src/textures.js`: procedural canvas textures (carpet, navy drum glass, wood slats, mural, signs, stairwell paintings).
- `src/Player.jsx`: walking (pointer lock or touch), jump/crouch, circle-vs-wall collision.
- `src/TouchControls.jsx`: on-screen joystick, drag-to-look, jump and pause buttons.
- `src/Minimap.jsx`: the black-and-pink map in the corner.
- `src/Labubu.jsx`: a customizable Labubu built from primitives: `fur`, `expression` (grin / happy / surprised / sleepy / mischief), `shirt` ('yale', 'stripes', or any color), `pants`, `overalls`, `hat`, `sitting`, `anim`.
- `src/LabubuParty.jsx`: the crew playing in the courtyard plus Labubus in meetings in every glass room.
- `src/slides.js`: lecture slides for eight Fall 2026 MBA courses (MGT 409, 404, 407, 887, 402, 538, 800, 541) on the classroom screens and meeting-room monitors.
- `src/LabubuCrowd.jsx`: 30 seated Labubu students per classroom, drawn with shared instanced meshes.
- `src/Professor.jsx` + `src/Faculty.jsx`: cartoon Hogwarts professors teaching each class (McGonagall, Slughorn, Snape, Lockhart, Moody, Flitwick), plus Hagrid in the courtyard.
- `src/Zaman.jsx`: Prof. Tauhid Zaman in his real room (Evans 2200, MGT 409), in a black-and-pink hoodie with a Labubu on his pants. Walk up, look at him, and click (or press E) to chat; he turns to face you.
- `src/Schott.jsx`: Prof. Peter Schott (Statistics) in the Betts Classroom (2420), in a light blue button-down with a Totoro plush under his arm. Chat works the same way.
- `src/ChatPanel.jsx` + `src/chatStore.js` + `src/useChatProf.js`: the chat window, the shared near/open state, and the walk-up-and-turn behaviour shared by the chat professors.
- `src/HandsomeDan.jsx`: Handsome Dan touring a loop of 1000 randomly chosen classrooms (blue dot on the map).

The layout is estimated from the wayfinding plan posted on the floor, so room sizes are approximate. The Stair G painting comes from a photo; the other stairwell paintings are made up.

Made for MGT 409: AI Foundations for Managers, Lecture 13.
