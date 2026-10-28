import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshDistortMaterial, Sparkles, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { OrbMood, Phase } from '../types'

const PALETTE: Record<OrbMood, string> = {
  idle: '#5eead4',
  quiz: '#8b7bff',
  submitting: '#fbbf24',
  success: '#34d399',
  mixed: '#a78bfa',
  low: '#fb7185',
}

const TARGETS: Record<'desktop' | 'mobile', Record<Phase, { position: [number, number, number]; scale: number }>> = {
  desktop: {
    landing: { position: [3.06, 0.52, -0.8], scale: 0.8 },
    quiz: { position: [3.2, 0.2, -3], scale: 0.55 },
    results: { position: [3.4, 1.1, -2.6], scale: 0.62 },
  },
  mobile: {
    landing: { position: [0, 2.55, -1.2], scale: 0.48 },
    quiz: { position: [0, 2.3, -3], scale: 0.36 },
    results: { position: [0, 2.05, -2.6], scale: 0.45 },
  },
}

const ORB_VERTEX = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;

  void main() {
    vec3 displaced = position + normal * (
      0.026 * sin(position.y * 4.0 + uTime * 1.6) +
      0.018 * sin(position.x * 5.0 - uTime * 0.9)
    );
    vPos = displaced;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const ORB_FRAGMENT = `
  uniform float uTime;
  uniform float uEnergy;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.3);
    float band = 0.5 + 0.5 * sin(vPos.y * 4.5 + uTime * 1.2 + sin(vPos.x * 3.0) * 0.8);
    float shimmer = 0.5 + 0.5 * sin(vPos.x * 9.0 + uTime * 1.7) * sin(vPos.z * 7.0 - uTime);
    vec3 color = mix(uColorA, uColorB, clamp(band * 0.7 + shimmer * 0.3, 0.0, 1.0));
    float alpha = (0.05 + fresnel * 0.85 + shimmer * 0.045) * (0.8 + uEnergy * 0.5);
    gl_FragColor = vec4(color * (0.95 + uEnergy * 1.1), alpha);
  }
`

interface SceneProps {
  phase: Phase
  mood: OrbMood
  pulse: number
  mobile: boolean
  reduced: boolean
  onPoke: () => void
}

function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera } = useThree()
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [])

  useFrame((_, delta) => {
    const strength = reduced ? 0 : 1
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.current.x * 0.45 * strength, 2.2, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.current.y * 0.28 * strength, 2.2, delta)
    camera.lookAt(0, 0, 0)
  })

  return null
}

function OrbRig({ phase, mobile, children }: { phase: Phase; mobile: boolean; children: ReactNode }) {
  const rig = useRef<THREE.Group>(null!)
  const target = TARGETS[mobile ? 'mobile' : 'desktop'][phase]
  const targetPosition = useMemo(() => new THREE.Vector3(...target.position), [target])

  useFrame((_, delta) => {
    const group = rig.current
    group.position.lerp(targetPosition, 1 - Math.exp(-2.6 * delta))
    const nextScale = THREE.MathUtils.damp(group.scale.x, target.scale, 2.6, delta)
    group.scale.setScalar(nextScale)
  })

  return <group ref={rig}>{children}</group>
}

function OrbBody({
  mood,
  pulse,
  reduced,
  onPoke,
}: {
  mood: OrbMood
  pulse: number
  reduced: boolean
  onPoke: () => void
}) {
  const spin = useRef<THREE.Group>(null!)
  const material = useRef<any>(null)
  const shell = useRef<THREE.ShaderMaterial>(null!)
  const shock = useRef<THREE.Mesh>(null!)
  const shockMaterial = useRef<THREE.MeshBasicMaterial>(null!)
  const rings = useRef<THREE.Group>(null!)
  const satellites = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const pulseRef = useRef(0)
  const lastPulse = useRef(pulse)
  const accent = PALETTE[mood]
  const smoothColor = useRef(new THREE.Color(PALETTE.idle))
  const targetColor = useMemo(() => new THREE.Color(accent), [accent])
  const shellUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uColorA: { value: new THREE.Color('#6ee7ff') },
      uColorB: { value: new THREE.Color('#a78bfa') },
    }),
    [],
  )

  useEffect(() => {
    if (pulse !== lastPulse.current) {
      lastPulse.current = pulse
      pulseRef.current = 1
    }
  }, [pulse])

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
    }
  }, [])

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime
    pulseRef.current = Math.max(0, pulseRef.current - delta * 1.35)
    const energy = pulseRef.current

    smoothColor.current.lerp(targetColor, 1 - Math.exp(-3.2 * delta))

    if (material.current) {
      material.current.color.setRGB(0.018, 0.03, 0.058)
      material.current.emissive.copy(smoothColor.current)
      material.current.emissiveIntensity = 0.2 + energy * 1.1
      material.current.distort = 0.26 + energy * 0.24 + Math.sin(elapsed * 0.9) * 0.035
      material.current.speed = reduced ? 0.35 : 1.2
    }
    if (shell.current) {
      shell.current.uniforms.uTime.value = reduced ? 0 : elapsed
      shell.current.uniforms.uEnergy.value = energy
      shell.current.uniforms.uColorA.value.copy(smoothColor.current)
      shell.current.uniforms.uColorB.value.set('#a78bfa')
    }

    const body = spin.current
    body.rotation.y += delta * (reduced ? 0.04 : 0.2)
    body.rotation.x = Math.sin(elapsed * 0.22) * 0.16
    const scale = (hovered ? 1.05 : 1) * (1 + energy * 0.12)
    body.scale.setScalar(scale)

    if (rings.current) {
      rings.current.rotation.y += delta * (reduced ? 0.02 : 0.12)
      rings.current.rotation.z = Math.sin(elapsed * 0.18) * 0.12
    }
    if (satellites.current) {
      satellites.current.rotation.y -= delta * (reduced ? 0.05 : 0.3)
      satellites.current.rotation.x = Math.sin(elapsed * 0.3) * 0.2
    }
    if (shock.current && shockMaterial.current) {
      shock.current.scale.setScalar(1.5 + (1 - energy) * 1.1)
      shockMaterial.current.opacity = energy * 0.3
    }
    if (state.pointer) {
      body.position.x = THREE.MathUtils.damp(body.position.x, state.pointer.x * 0.06, 2, delta)
      body.position.y = THREE.MathUtils.damp(body.position.y, state.pointer.y * 0.06, 2, delta)
    }
  })

  return (
    <group
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        onPoke()
      }}
    >
      <group ref={spin}>
        <mesh>
          <icosahedronGeometry args={[1.5, 5]} />
          <MeshDistortMaterial
            ref={material}
            color={accent}
            emissive={accent}
            emissiveIntensity={0.2}
            metalness={0.92}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.1}
            distort={0.26}
            speed={1.2}
          />
        </mesh>

        <mesh scale={1.085}>
          <sphereGeometry args={[1.5, 72, 72]} />
          <shaderMaterial
            ref={shell}
            uniforms={shellUniforms}
            vertexShader={ORB_VERTEX}
            fragmentShader={ORB_FRAGMENT}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
          />
        </mesh>

        <mesh scale={1.07}>
          <icosahedronGeometry args={[1.5, 2]} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.3} />
        </mesh>

        <mesh scale={0.66}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.22}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh scale={0.34}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#e9fbff" transparent opacity={0.9} toneMapped={false} />
        </mesh>

        <mesh ref={shock} rotation={[0, 0, 0]}>
          <ringGeometry args={[1.85, 1.88, 128]} />
          <meshBasicMaterial
            ref={shockMaterial}
            color={accent}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={rings}>
        <mesh rotation={[Math.PI / 2.1, 0.2, 0]}>
          <torusGeometry args={[2.15, 0.0065, 8, 180]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, -0.5, 0.6]}>
          <torusGeometry args={[2.45, 0.005, 8, 180]} />
          <meshBasicMaterial
            color="#c4b5fd"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[1.15, 0.9, -0.3]}>
          <torusGeometry args={[1.85, 0.0045, 8, 160]} />
          <meshBasicMaterial
            color="#f0abfc"
            transparent
            opacity={0.34}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={satellites}>
        {[
          [2.1, 0, 0],
          [0, 0, 2.1],
          [-1.5, 1.1, -1.35],
        ].map((position, index) => (
          <mesh key={index} position={position as [number, number, number]} scale={0.045 - index * 0.006}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color={index === 1 ? '#f0abfc' : '#9ff6ff'} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <div className="scene-fallback" /> : this.props.children
  }
}

export function Scene({ phase, mood, pulse, mobile, reduced, onPoke }: SceneProps) {
  return (
    <div className="scene" aria-hidden="true">
      <SceneBoundary>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 9], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <CameraRig reduced={reduced} />
          <ambientLight intensity={0.22} />
          <pointLight position={[5, 4, 6]} intensity={28} color="#67e8f9" />
          <pointLight position={[-6, -3, 2]} intensity={18} color="#a78bfa" />
          <pointLight position={[0, -4, -6]} intensity={12} color="#f0abfc" />

          <Environment resolution={128} frames={1}>
            <Lightformer form="circle" intensity={3} position={[-4, 3, -6]} scale={8} color="#6ee7ff" />
            <Lightformer form="ring" intensity={2} position={[5, -2, -4]} scale={7} color="#a78bfa" />
            <Lightformer form="rect" intensity={1.6} position={[0, 6, 2]} scale={[10, 2, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={1.2} position={[-7, -4, 1]} scale={[3, 8, 1]} color="#f0abfc" />
          </Environment>

          <Stars
            radius={70}
            depth={40}
            count={mobile ? 1300 : 2600}
            factor={4}
            saturation={0}
            fade
            speed={reduced ? 0 : 0.4}
          />
          <Sparkles
            count={mobile ? 26 : 44}
            scale={[5.5, 5.5, 5.5]}
            size={2.4}
            speed={reduced ? 0 : 0.35}
            opacity={0.55}
            color="#9ff6ff"
          />

          <OrbRig phase={phase} mobile={mobile}>
            <OrbBody mood={mood} pulse={pulse} reduced={reduced} onPoke={onPoke} />
          </OrbRig>

          {!mobile && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={0.85} luminanceThreshold={0.24} luminanceSmoothing={0.85} mipmapBlur />
            </EffectComposer>
          )}
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
