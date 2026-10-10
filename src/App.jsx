import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import ChatPanel from './ChatPanel.jsx'
import { CHAT_PROFS, chat, typing, useChat } from './chatStore.js'
import { EYE, SPAWN } from './layout.js'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  const onWhere = useCallback((w) => setWhere(w), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches) // phones + tablets; touchscreen laptops still get mouse mode
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn
  useEffect(() => {
    const k = (e) => e.code === 'KeyM' && !typing(e) && setShowMap((v) => !v)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  // chat with a professor: walk up, look at them, then click (or press E)
  const { near, open } = useChat()
  const canChat = playing && near && !open
  const openChat = useCallback(() => {
    const { near, open } = chat.get()
    if (!near || open) return
    chat.set({ open: near })
    document.exitPointerLock?.() // frees the mouse for the chat window
  }, [])
  const closeChat = useCallback(() => {
    chat.set({ open: null })
    if (!touchRef.current.active) lockRef.current?.() // back to walking
  }, [])
  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && closeChat()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, closeChat])
  useEffect(() => {
    if (!canChat) return
    const key = (e) => e.code === 'KeyE' && openChat()
    const click = () => document.pointerLockElement && openChat()
    window.addEventListener('keydown', key)
    window.addEventListener('mousedown', click)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('mousedown', click)
    }
  }, [canChat, openChat])

  return (
    <>
      <Canvas
        camera={{ fov: 72, near: 0.05, far: 800, position: [SPAWN.x, EYE, SPAWN.z] }}
        dpr={[1, 1.75]}
      >
        <World />
        <Player lockRef={lockRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && !open && <div className="crosshair" />}
      {canChat && (
        <button className="chatprompt" onClick={openChat}>
          {touchOn ? 'Tap here' : 'Click or press E'} to chat with <b>{CHAT_PROFS[near].name}</b>
        </button>
      )}
      {open && <ChatPanel slug={open} onClose={closeChat} />}
      {touchOn && !open && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}

      {!playing && !open && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">Yale SOM · Evans Hall</div>
            <h1>Floor 2</h1>
            <p className="sub">Classroom drums, the cloister, Ross Library, the Beinecke Terrace Room, and the courtyard.</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to hurry)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>W A S D</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> sprint</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
