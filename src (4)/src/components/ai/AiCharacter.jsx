import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useAnimations,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';

import VoiceRecognition from './VoiceRecognition';

function CanvasLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-center text-white shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        <p className="text-xs font-bold">Loading avatar {Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

function findMorphMesh(root) {
  let target = null;

  root?.traverse?.((child) => {
    if (target) return;

    if (
      child.isMesh
      && child.morphTargetDictionary
      && child.morphTargetInfluences
      && (
        child.morphTargetDictionary.viseme_aa !== undefined
        || child.morphTargetDictionary.jawOpen !== undefined
      )
    ) {
      target = child;
    }
  });

  return target;
}

function AvatarModel({ mouthLevel }) {
  const group = useRef();
  const morphMeshRef = useRef(null);
  const currentState = useRef('idle');
  const currentIdle = useRef('Idle1');

  const { scene } = useGLTF('/aicheractar.glb?pose=T');
  const idle1 = useGLTF('/Idle.glb');
  const idle2 = useGLTF('/Idle2.glb');
  const idle3 = useGLTF('/Idle3.glb');
  const talk = useGLTF('/Talking.glb');

  const animations = useMemo(() => {
    const validAnimations = [];

    const addAnim = (gltf, name) => {
      const clip = gltf?.animations?.[0];

      if (!clip) return;

      const cloned = clip.clone();
      cloned.name = name;
      validAnimations.push(cloned);
    };

    addAnim(idle1, 'Idle1');
    addAnim(idle2, 'Idle2');
    addAnim(idle3, 'Idle3');
    addAnim(talk, 'Talk');

    return validAnimations;
  }, [idle1, idle2, idle3, talk]);

  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    morphMeshRef.current = findMorphMesh(scene);

    scene.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame(() => {
    const mesh = morphMeshRef.current;
    if (!mesh?.morphTargetDictionary || !mesh?.morphTargetInfluences) return;

    const mouthIdx =
      mesh.morphTargetDictionary.viseme_aa
      ?? mesh.morphTargetDictionary.jawOpen;

    if (mouthIdx === undefined) return;

    const current = mesh.morphTargetInfluences[mouthIdx] || 0;
    const target = THREE.MathUtils.clamp(mouthLevel * 1.8, 0, 1);

    mesh.morphTargetInfluences[mouthIdx] = THREE.MathUtils.lerp(current, target, 0.35);
  });

  useEffect(() => {
    if (!actions?.Idle1) return;

    actions.Idle1.reset().fadeIn(0.45).play();

    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions]);

  useEffect(() => {
    if (!actions) return;

    const talkAction = actions.Talk;
    const activeIdle = () => actions[currentIdle.current];
    const isTalking = mouthLevel > 0.045;

    if (isTalking && currentState.current !== 'talk') {
      activeIdle()?.fadeOut(0.35);

      if (talkAction) {
        talkAction.reset().fadeIn(0.35).play();
        talkAction.setLoop(THREE.LoopRepeat);
      }

      currentState.current = 'talk';
      return;
    }

    if (!isTalking && mouthLevel < 0.018 && currentState.current !== 'idle') {
      talkAction?.fadeOut(0.35);
      activeIdle()?.reset().fadeIn(0.35).play();
      currentState.current = 'idle';
    }
  }, [mouthLevel, actions]);

  useEffect(() => {
    if (!actions) return undefined;

    const idleNames = ['Idle1', 'Idle2', 'Idle3'];
    let timeoutId;

    const switchIdle = () => {
      if (currentState.current === 'idle') {
        const nextIdleName = idleNames[Math.floor(Math.random() * idleNames.length)];

        if (currentIdle.current !== nextIdleName && actions[nextIdleName]) {
          actions[currentIdle.current]?.fadeOut(0.4);
          actions[nextIdleName].reset().fadeIn(0.4).play();
          currentIdle.current = nextIdleName;
        }
      }

      timeoutId = setTimeout(switchIdle, 4500 + Math.random() * 4500);
    };

    timeoutId = setTimeout(switchIdle, 4500);

    return () => clearTimeout(timeoutId);
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={2.22} position={[0, -2.08, 0]} />
    </group>
  );
}

export default function AiCharacter() {
  const [mouthLevel, setMouthLevel] = useState(0);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#050713] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[150px]" />
      </div>

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-center px-4 pt-4 sm:pt-6">
        <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-center shadow-2xl backdrop-blur-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">AI Voice Practice</p>
          <h1 className="text-sm font-black text-white sm:text-base">Talk with Vanni</h1>
        </div>
      </header>

      <section className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 1.7]}
          camera={{ position: [0, 1.75, 5.1], fov: 52 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={<CanvasLoader />}>
            <AvatarModel mouthLevel={mouthLevel} />
            <Environment preset="apartment" />
            <ContactShadows
              position={[0, -1.32, 0]}
              opacity={0.45}
              blur={2.8}
              scale={6}
            />
          </Suspense>

          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 5, 5]} intensity={1.6} />
          <spotLight position={[-2, 4, 4]} intensity={1.1} angle={0.34} penumbra={0.8} />

          <OrbitControls
            enableZoom={false}
            enableRotate={false}
            enablePan={false}
          />
        </Canvas>
      </section>

      <section className="absolute bottom-0 left-0 right-0 z-30">
        <VoiceRecognition onMouthLevel={setMouthLevel} />
      </section>
    </main>
  );
}

useGLTF.preload('/aicheractar.glb?pose=T');
useGLTF.preload('/Idle.glb');
useGLTF.preload('/Idle2.glb');
useGLTF.preload('/Idle3.glb');
useGLTF.preload('/Talking.glb');
