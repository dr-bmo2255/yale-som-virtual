import { useRef } from 'react'
import * as THREE from 'three'
import { useChatProf } from './useChatProf.js'

// Prof. Peter Schott (Statistics): light blue button-down with the collar open, khakis, wavy brown
// hair, and a Totoro plush under his arm. Built from primitives like the other professors.
// Figure faces +z. Walk up and look at him to chat; he turns to face you while you talk.

export const SCHOTT = { slug: 'peter-schott', name: 'Peter Schott', height: 1.86 }

const SKIN = '#e6b995'
const HAIR = '#5b3d27'
const SHIRT = '#a6c4ee'
const SHIRT_DARK = '#8fb1e2'
const KHAKI = '#b7a17a'
const TOTORO = '#7b8389'
const CREAM = '#efe6cf'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const CONE = new THREE.ConeGeometry(1, 1, 16)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const TORSO = new THREE.CylinderGeometry(0.2, 0.225, 0.6, 28)
const SMILE = new THREE.TorusGeometry(1, 0.2, 8, 20, Math.PI)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

// wavy hair: a cap plus a ring of tufts swept up and back
const WAVES = Array.from({ length: 11 }, (_, i) => {
  const a = -Math.PI * 0.62 + (i / 10) * Math.PI * 1.24 // across the top, ear to ear
  return { p: [Math.sin(a) * 0.105, 1.79 + Math.cos(a) * 0.04, 0.035 + Math.cos(i * 2.4) * 0.018], s: 0.04 + (i % 3) * 0.005 }
})

// A Totoro plush, about 30 cm tall. Origin at its base, facing +z.
function Totoro(props) {
  return (
    <group {...props}>
      <B c={TOTORO} p={[0, 0.15, 0]} s={[0.13, 0.155, 0.12]} />
      <B c={CREAM} p={[0, 0.125, 0.045]} s={[0.1, 0.105, 0.085]} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CONE} c={TOTORO} p={[0.055 * sx, 0.325, 0]} r={[0, 0, -0.25 * sx]} s={[0.022, 0.085, 0.018]} />
          <B c="#ffffff" p={[0.045 * sx, 0.235, 0.09]} s={[0.02, 0.02, 0.012]} />
          <B c="#111111" p={[0.045 * sx, 0.235, 0.1]} s={[0.009, 0.009, 0.006]} />
          <B c={TOTORO} p={[0.125 * sx, 0.13, 0.02]} s={[0.03, 0.07, 0.035]} />
          <B c={TOTORO} p={[0.06 * sx, 0.012, 0.06]} s={[0.04, 0.02, 0.05]} />
          {[-1, 0, 1].map((k) => (
            <B key={k} g={BOX} c="#22262a" p={[0.105 * sx, 0.205 + k * 0.012, 0.085]} r={[0, 0, k * 0.2 * sx]} s={[0.07, 0.003, 0.003]} />
          ))}
        </group>
      ))}
      <B c="#22262a" p={[0, 0.222, 0.108]} s={[0.014, 0.008, 0.008]} />
      {[-0.035, 0, 0.035].map((x) => (
        <B key={x} g={CONE} c={TOTORO} p={[x, 0.17, 0.128]} r={[Math.PI / 2.4, 0, Math.PI]} s={[0.014, 0.016, 0.004]} />
      ))}
    </group>
  )
}

export default function Schott({ position = [0, 0, 0], rotation = 0, phase = 0 }) {
  const root = useRef()
  const armR = useRef()
  const totoro = useRef()
  const s = SCHOTT.height / 1.9

  useChatProf({ slug: SCHOTT.slug, root, position, rotation, phase }, (t, { talking, busy }) => {
    // big friendly gestures with his free hand; Totoro bounces along
    const wave = Math.max(0, Math.sin(t * (busy ? 5 : 1.5)))
    armR.current.rotation.x = -0.25 - wave * (talking ? 1.3 : 1.0)
    armR.current.rotation.z = -0.2 - wave * 0.35
    totoro.current.position.y = -0.36 + Math.abs(Math.sin(t * (busy ? 6 : 2))) * 0.012
    totoro.current.rotation.z = Math.sin(t * 1.6) * 0.06
  })

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={s}>
      {/* brown shoes + khakis + belt */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c="#5a3a22" p={[0.1 * sx, 0.045, 0.04]} s={[0.095, 0.09, 0.27]} />
          <B g={CAP} c={KHAKI} p={[0.1 * sx, 0.5, 0]} s={[0.083, 0.28, 0.09]} />
        </group>
      ))}
      <group scale={[1, 1, 0.8]}>
        <B g={CYL} c={KHAKI} p={[0, 0.9, 0]} s={[0.222, 0.1, 0.222]} />
        <B g={CYL} c="#4a2f1c" p={[0, 0.945, 0]} s={[0.228, 0.035, 0.228]} />
        {/* light blue button-down */}
        <mesh geometry={TORSO} material={m(SHIRT)} position={[0, 1.25, 0]} />
        <B c={SHIRT} p={[0, 1.5, 0]} s={[0.275, 0.095, 0.2]} />
      </group>
      <B g={BOX} c="#c9a44a" o={{ metalness: 0.7, roughness: 0.35 }} p={[0, 0.945, 0.184]} s={[0.04, 0.032, 0.01]} />
      <B g={BOX} c={SHIRT_DARK} p={[0, 1.2, 0.172]} r={[-0.04, 0, 0]} s={[0.03, 0.48, 0.008]} />
      {[1.38, 1.28, 1.18, 1.08, 1.0].map((y, i) => (
        <B key={y} c="#f4f6fa" p={[0, y, 0.166 + i * 0.004]} s={[0.008, 0.008, 0.005]} />
      ))}
      <B g={BOX} c={SHIRT_DARK} p={[0.105, 1.3, 0.158]} r={[0, 0.25, 0]} s={[0.085, 0.085, 0.006]} />
      {/* open collar: skin at the throat, a collar wing on each side */}
      <B c={SKIN} p={[0, 1.5, 0.1]} s={[0.05, 0.07, 0.03]} />
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c={SHIRT_DARK} p={[0.05 * sx, 1.548, 0.07]} r={[0.95, 0.2 * sx, -0.55 * sx]} s={[0.06, 0.034, 0.01]} />
      ))}
      <B g={CYL} c={SHIRT} p={[0, 1.555, -0.03]} s={[0.07, 0.05, 0.065]} />
      <B g={CYL} c={SKIN} p={[0, 1.575, 0]} s={[0.05, 0.08, 0.05]} />

      {/* his left arm is bent to carry Totoro; his right gestures */}
      <group position={[0.265, 1.46, 0]} rotation={[-0.35, 0, 0.12]}>
        <B g={CAP} c={SHIRT} p={[0, -0.14, 0]} s={[0.066, 0.12, 0.066]} />
        <group position={[0, -0.3, 0]} rotation={[-1.1, 0, -0.5]}>
          <B g={CAP} c={SHIRT} p={[0, -0.11, 0]} s={[0.06, 0.1, 0.06]} />
          <B g={CYL} c={SHIRT_DARK} p={[0, -0.235, 0]} s={[0.056, 0.035, 0.056]} />
          <B c={SKIN} p={[0, -0.285, 0]} s={[0.045, 0.055, 0.04]} />
        </group>
        <group ref={totoro} position={[-0.09, -0.36, 0.14]} rotation={[0.35, -0.15, 0]}>
          <Totoro />
        </group>
      </group>
      <group ref={armR} position={[-0.265, 1.46, 0]}>
        <B g={CAP} c={SHIRT} p={[0, -0.24, 0]} s={[0.066, 0.2, 0.066]} />
        <B g={CYL} c={SHIRT_DARK} p={[0, -0.45, 0]} s={[0.058, 0.035, 0.058]} />
        <B c={SKIN} p={[0, -0.5, 0.02]} s={[0.045, 0.055, 0.04]} />
      </group>

      {/* head: wavy brown hair, easy smile */}
      <B c={SKIN} p={[0, 1.7, 0]} s={[0.12, 0.14, 0.13]} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B c={SKIN} p={[0.122 * sx, 1.7, 0]} s={[0.02, 0.035, 0.02]} />
          <B c="#ffffff" p={[0.045 * sx, 1.725, 0.112]} s={[0.022, 0.018, 0.012]} />
          <B c="#5f7f95" p={[0.045 * sx, 1.725, 0.122]} s={[0.011, 0.012, 0.008]} />
          <B g={BOX} c={HAIR} p={[0.047 * sx, 1.76, 0.115]} r={[0, 0, -0.1 * sx]} s={[0.046, 0.01, 0.01]} />
          <B c={HAIR} p={[0.108 * sx, 1.755, -0.02]} s={[0.028, 0.055, 0.085]} />
        </group>
      ))}
      <B c={SKIN} p={[0, 1.69, 0.128]} s={[0.022, 0.03, 0.025]} />
      <B g={SMILE} c="#8a4a3c" p={[0, 1.662, 0.118]} r={[0, 0, Math.PI]} s={[0.036, 0.022, 0.02]} />
      <B c={HAIR} p={[0, 1.78, -0.03]} s={[0.126, 0.1, 0.13]} />
      {WAVES.map((w, i) => (
        <B key={i} c={HAIR} p={w.p} s={[w.s, w.s * 0.8, w.s * 1.15]} />
      ))}
    </group>
  )
}
