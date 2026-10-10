import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { useChatProf } from './useChatProf.js'

// Prof. Tauhid Zaman (MGT 409): black-and-pink hoodie, joggers, and a Labubu hanging from his pants.
// Built from primitives like the other professors. Figure faces +z.
// Walk up and look at him to chat; he turns to face you while you talk.

export const ZAMAN = { slug: 'tauhid-zaman', name: 'Tauhid Zaman', height: 1.78 }

const SKIN = '#c08a5e'
const HAIR = '#0d0c0e'
const HOODIE = '#101014'
const PANTS = '#2a2c33'
const PINK = '#ff4fa3'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const TORSO = new THREE.CylinderGeometry(0.2, 0.25, 0.62, 28)
const SMILE = new THREE.TorusGeometry(1, 0.2, 8, 20, Math.PI)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

function chestPrint() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = PINK
  g.font = '900 84px "Arial Black", Impact, system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('BLACKPINK', 256, 68, 492)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })
}

export default function Zaman({ position = [0, 0, 0], rotation = 0, phase = 0 }) {
  const root = useRef()
  const armR = useRef()
  const armL = useRef()
  const charm = useRef()
  const print = useMemo(chestPrint, [])
  const s = ZAMAN.height / 1.9

  useChatProf({ slug: ZAMAN.slug, root, position, rotation, phase }, (t, { talking, busy }) => {
    // talks with his hands; both go up while he is thinking of an answer
    const wave = Math.max(0, Math.sin(t * (busy ? 5 : 1.3)))
    armR.current.rotation.x = -0.2 - wave * (talking ? 1.1 : 0.9)
    armR.current.rotation.z = -0.2 - wave * 0.25
    armL.current.rotation.x = 0.1 - (busy ? Math.max(0, Math.sin(t * 5 + 1.5)) * 0.9 : 0)
    charm.current.rotation.z = Math.sin(t * 2.2) * 0.18
    charm.current.rotation.x = Math.sin(t * 1.7) * 0.12
  })

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={s}>
      {/* sneakers + joggers */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c="#f4f4f6" p={[0.1 * sx, 0.05, 0.04]} s={[0.1, 0.1, 0.27]} />
          <B g={BOX} c={PINK} p={[0.1 * sx, 0.012, 0.04]} s={[0.104, 0.024, 0.274]} />
          <B g={CAP} c={PANTS} p={[0.1 * sx, 0.5, 0]} s={[0.085, 0.28, 0.095]} />
          <B g={CYL} c="#1c1d22" p={[0.1 * sx, 0.12, 0]} s={[0.075, 0.05, 0.085]} />
        </group>
      ))}

      {/* hoodie: body, hem, shoulders, kangaroo pocket, hood, pink drawstrings and chest print */}
      <group scale={[1, 1, 0.82]}>
        <mesh geometry={TORSO} material={m(HOODIE)} position={[0, 1.2, 0]} />
        <B g={CYL} c="#1a1a20" p={[0, 0.9, 0]} s={[0.255, 0.07, 0.255]} />
        <B c={HOODIE} p={[0, 1.5, 0]} s={[0.28, 0.1, 0.2]} />
        <B c={HOODIE} p={[0, 1.57, -0.13]} s={[0.16, 0.13, 0.12]} />
      </group>
      <B g={BOX} c="#1a1a20" p={[0, 1.03, 0.19]} s={[0.25, 0.13, 0.03]} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CYL} c={PINK} p={[0.04 * sx, 1.4, 0.178]} r={[-0.05, 0, 0.06 * sx]} s={[0.006, 0.15, 0.006]} />
          <B c={PINK} p={[0.045 * sx, 1.32, 0.184]} s={[0.011, 0.016, 0.011]} />
        </group>
      ))}
      <mesh material={print} position={[0, 1.24, 0.186]} rotation={[-0.08, 0, 0]}>
        <planeGeometry args={[0.3, 0.075]} />
      </mesh>
      <B g={CYL} c={SKIN} p={[0, 1.57, 0]} s={[0.05, 0.08, 0.05]} />

      {/* arms: his left hangs, his right gestures */}
      <group ref={armL} position={[0.27, 1.46, 0]} rotation={[0.1, 0, 0.16]}>
        <B g={CAP} c={HOODIE} p={[0, -0.24, 0]} s={[0.07, 0.2, 0.07]} />
        <B g={CYL} c="#1a1a20" p={[0, -0.45, 0]} s={[0.062, 0.04, 0.062]} />
        <B c={SKIN} p={[0, -0.5, 0.02]} s={[0.045, 0.055, 0.04]} />
      </group>
      <group ref={armR} position={[-0.27, 1.46, 0]}>
        <B g={CAP} c={HOODIE} p={[0, -0.24, 0]} s={[0.07, 0.2, 0.07]} />
        <B g={CYL} c="#1a1a20" p={[0, -0.45, 0]} s={[0.062, 0.04, 0.062]} />
        <B c={SKIN} p={[0, -0.5, 0.02]} s={[0.045, 0.055, 0.04]} />
      </group>

      {/* the Labubu, clipped to his waistband on a pink strap */}
      <group ref={charm} position={[0.2, 0.9, 0.13]}>
        <B g={CYL} c={PINK} p={[0, -0.07, 0]} s={[0.007, 0.14, 0.007]} />
        <B g={CYL} c="#c9a44a" o={{ metalness: 0.8, roughness: 0.3 }} p={[0, -0.005, 0]} r={[Math.PI / 2, 0, 0]} s={[0.018, 0.008, 0.018]} />
        <Labubu fur="#ff9ccb" expression="grin" height={0.26} position={[0, -0.4, 0]} rotation={0.25} phase={phase} />
      </group>

      {/* head: short black hair, big grin */}
      <B c={SKIN} p={[0, 1.7, 0]} s={[0.12, 0.14, 0.13]} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B c={SKIN} p={[0.122 * sx, 1.7, 0]} s={[0.02, 0.035, 0.02]} />
          <B c="#ffffff" p={[0.045 * sx, 1.725, 0.112]} s={[0.022, 0.018, 0.012]} />
          <B c="#1d1410" p={[0.045 * sx, 1.725, 0.122]} s={[0.011, 0.012, 0.008]} />
          <B g={BOX} c={HAIR} p={[0.047 * sx, 1.762, 0.115]} r={[0, 0, -0.12 * sx]} s={[0.046, 0.011, 0.01]} />
          <B c={HAIR} p={[0.108 * sx, 1.76, -0.02]} s={[0.03, 0.06, 0.09]} />
        </group>
      ))}
      <B c={SKIN} p={[0, 1.69, 0.128]} s={[0.022, 0.03, 0.025]} />
      <B g={SMILE} c="#5a211d" p={[0, 1.662, 0.118]} r={[0, 0, Math.PI]} s={[0.034, 0.024, 0.02]} />
      <B c={HAIR} p={[0, 1.78, -0.025]} s={[0.127, 0.105, 0.132]} />
      <B c={HAIR} p={[0, 1.835, 0.045]} r={[0.35, 0, 0]} s={[0.1, 0.04, 0.07]} />
    </group>
  )
}
