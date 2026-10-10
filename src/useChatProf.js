import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { chat } from './chatStore.js'

const CHAT_RANGE = 5 // meters

// shortest signed distance from angle a to angle b
const turn = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

// Shared behaviour for a professor you can chat with: flags them as `near` when you walk up and
// look at them, and turns `root` to face you while you talk (otherwise they scan the room).
// `animate(t, { talking, busy })` runs every frame for the figure's own arm and prop motion.
export function useChatProf({ slug, root, position, rotation, phase = 0 }, animate) {
  const fwd = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime + phase
    const dx = camera.position.x - position[0]
    const dz = camera.position.z - position[2]
    const dist = Math.hypot(dx, dz)
    camera.getWorldDirection(fwd)
    const looking = dist > 0.01 && (-dx * fwd.x - dz * fwd.z) / dist > 0.8
    const { near, open, busy } = chat.get()
    const talking = open === slug
    if (dist < CHAT_RANGE && looking) chat.set({ near: slug })
    else if (near === slug) chat.set({ near: null })

    const target = talking || dist < 2.5 ? Math.atan2(dx, dz) : rotation + Math.sin(t * 0.4) * 0.35
    root.current.rotation.y += turn(root.current.rotation.y, target) * Math.min(1, dt * 5)
    animate(t, { talking, busy: talking && busy })
  })
}
