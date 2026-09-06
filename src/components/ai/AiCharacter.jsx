import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

import VoiceRecognition from './VoiceRecognition';

function CanvasLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="rounded-2xl border border-white/10 bg-[#0b1220]/95 px-4 py-3 text-center text-white shadow-lg">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
        <p className="text-[11px] font-bold text-slate-300">
          Preparing Luna {Math.round(progress)}%
        </p>
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
    if (!actions?.Idle1) return undefined;

    actions.Idle1.reset().fadeIn(0.35).play();

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
      activeIdle()?.fadeOut(0.3);

      if (talkAction) {
        talkAction.reset().fadeIn(0.3).play();
        talkAction.setLoop(THREE.LoopRepeat);
      }

      currentState.current = 'talk';
      return;
    }

    if (!isTalking && mouthLevel < 0.018 && currentState.current !== 'idle') {
      talkAction?.fadeOut(0.3);
      activeIdle()?.reset().fadeIn(0.3).play();
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
          actions[currentIdle.current]?.fadeOut(0.35);
          actions[nextIdleName].reset().fadeIn(0.35).play();
          currentIdle.current = nextIdleName;
        }
      }

      timeoutId = window.setTimeout(switchIdle, 5000 + Math.random() * 5000);
    };

    timeoutId = window.setTimeout(switchIdle, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={2.24} position={[0, -2.08, 0]} />
    </group>
  );
}

export default function AiCharacter() {
  const [mouthLevel, setMouthLevel] = useState(0);
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/rooms');
  }, [navigate]);

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-[#050713] text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 32% 35%, rgba(13,148,136,0.10), transparent 34%), radial-gradient(circle at 78% 78%, rgba(79,70,229,0.09), transparent 32%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      <header className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#0b1220]/90 px-3.5 text-xs font-black text-slate-200 shadow-sm transition-colors hover:bg-[#111a2d] hover:text-white"
          aria-label="Go back"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" aria-hidden="true" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/92 px-3.5 py-2 shadow-sm sm:px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
            <i className="fa-solid fa-wave-square text-xs" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-300">
              Vaani AI
            </p>
            <h1 className="text-xs font-black text-white sm:text-sm">Luna Voice Coach</h1>
          </div>
        </div>

        <div className="hidden h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#0b1220]/90 px-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Private session
        </div>

        <div className="w-11 sm:hidden" />
      </header>

      <div className="pointer-events-none absolute bottom-[82px] left-0 right-0 top-[74px] lg:right-[22rem]">
        <div className="absolute left-1/2 top-[48%] h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.055] sm:h-[31rem] sm:w-[31rem]" />
        <div className="absolute left-1/2 top-[48%] h-[19rem] w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/[0.06] sm:h-[24rem] sm:w-[24rem]" />
        <div className="absolute bottom-4 left-1/2 h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <section className="absolute inset-0 lg:right-[22rem]">
        <Canvas
          dpr={[1, 1.35]}
          camera={{ position: [0, 1.72, 5.18], fov: 52 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={<CanvasLoader />}>
            <AvatarModel mouthLevel={mouthLevel} />
            <Environment preset="apartment" />
            <ContactShadows
              position={[0, -1.32, 0]}
              opacity={0.34}
              blur={2.4}
              scale={5.5}
              frames={1}
            />
          </Suspense>

          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 5, 5]} intensity={1.45} />
          <spotLight position={[-2, 4, 4]} intensity={0.9} angle={0.34} penumbra={0.8} />

          <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
        </Canvas>
      </section>

      <VoiceRecognition onMouthLevel={setMouthLevel} />
    </main>
  );
}

useGLTF.preload('/aicheractar.glb?pose=T');
useGLTF.preload('/Idle.glb');
useGLTF.preload('/Idle2.glb');
useGLTF.preload('/Idle3.glb');
useGLTF.preload('/Talking.glb');
