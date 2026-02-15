import React, { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber"; // Added useFrame
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import * as THREE from "three"; // Import THREE
import VoiceRecognition from "./VoiceRecognition";

function AvatarModel({ mouthLevel }) {
  const group = useRef();
  
  // State Refs
  const currentState = useRef("idle");
  const currentIdle = useRef("Idle1");
// .glb?pose=T
  // 1. Load Model & Animations
  const { scene, nodes } = useGLTF("/aicheractar.glb?pose=T");
  const idle1 = useGLTF("/Idle.glb");
  const idle2 = useGLTF("/Idle2.glb");
  const idle3 = useGLTF("/Idle3.glb");
  const talk = useGLTF("/Talking.glb");

  // 2. Rename Animations safely
  const animations = useMemo(() => {
    const validAnimations = [];
    const addAnim = (gltf, name) => {
      if (gltf.animations && gltf.animations.length > 0) {
        const clip = gltf.animations[0].clone();
        clip.name = name;
        validAnimations.push(clip);
      } else {
        console.warn(`Warning: ${name} GLB has no animations!`);
      }
    };
    addAnim(idle1, "Idle1");
    addAnim(idle2, "Idle2");
    addAnim(idle3, "Idle3");
    addAnim(talk, "Talk");
    return validAnimations;
  }, [idle1, idle2, idle3, talk]);

  const { actions } = useAnimations(animations, group);

  // 3. Lip Sync Logic (Moves the mouth)
  // We use useFrame to update the mouth smoothly every frame
  useFrame(() => {
    if (!nodes) return;
    
    // Find the head mesh (ReadyPlayerMe usually names it 'Wolf3D_Head')
    const headMesh = nodes.Wolf3D_Head || nodes.Wolf3D_Avatar;
    
    if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
      // 'viseme_aa' is the "Ah" mouth shape. 'jawOpen' is another option.
      const mouthIdx = headMesh.morphTargetDictionary["viseme_aa"] ?? headMesh.morphTargetDictionary["jawOpen"];
      
      if (mouthIdx !== undefined) {
        // Map audio level (0 to 1) to mouth open (0 to 1)
        // We multiply by a factor (e.g. 5) to make the mouth more responsive
        const targetValue = THREE.MathUtils.lerp(
          headMesh.morphTargetInfluences[mouthIdx],
          mouthLevel * 5, // Sensitivity
          0.5 // Smoothing
        );
        headMesh.morphTargetInfluences[mouthIdx] = targetValue;
      }
    }
  });

  // 4. Initial Mount
  useEffect(() => {
    if (actions && actions["Idle1"]) {
      actions["Idle1"].reset().fadeIn(0.5).play();
    }
  }, [actions]);

  // 5. Body Animation Switcher (Idle <-> Talk)
  useEffect(() => {
    if (!actions) return;

    const talkAction = actions["Talk"];
    const getActiveIdle = () => actions[currentIdle.current];

    // Added Logic: Hysteresis (Prevents flickering)
    // Start talking at 0.05, Stop talking at 0.01
    const isTalking = mouthLevel > 0.05;

    if (isTalking) {
      if (currentState.current !== "talk") {
        console.log("Starting Talk Animation..."); // Debug Log
        getActiveIdle()?.fadeOut(0.5);
        
        if (talkAction) {
            talkAction.reset().fadeIn(0.5).play();
            talkAction.setLoop(THREE.LoopRepeat); // Ensure it loops
        }
        currentState.current = "talk";
      }
    } else {
        // Only switch back if we dip really low (avoid flickering)
        if (mouthLevel < 0.02 && currentState.current !== "idle") {
            console.log("Stopping Talk Animation..."); // Debug Log
            talkAction?.fadeOut(0.5);
            getActiveIdle()?.reset().fadeIn(0.5).play();
            currentState.current = "idle";
        }
    }
  }, [mouthLevel, actions]);

  // 6. Random Idle Switcher
  useEffect(() => {
    if (!actions) return;
    const idleNames = ["Idle1", "Idle2", "Idle3"];

    const switchIdle = () => {
      if (currentState.current === "idle") {
        const randomIndex = Math.floor(Math.random() * idleNames.length);
        const nextIdleName = idleNames[randomIndex];

        if (currentIdle.current !== nextIdleName && actions[nextIdleName]) {
          console.log(`Switching Idle to: ${nextIdleName}`);
          actions[currentIdle.current]?.fadeOut(0.5);
          actions[nextIdleName].reset().fadeIn(0.5).play();
          currentIdle.current = nextIdleName;
        }
      }
      const nextTime = 5000 + Math.random() * 5000;
      timeoutId = setTimeout(switchIdle, nextTime);
    };

    let timeoutId = setTimeout(switchIdle, 5000);
    return () => clearTimeout(timeoutId);
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={2.3} position={[0, -2, 0]} />
    </group>
  );
}

export default function AiCharacter() {
  const [mouthLevel, setMouthLevel] = useState(0);

  return (
    <div className="h-screen w-full relative bg-gray-900">
      <Canvas camera={{ position: [0, 2, 5], fov: 55 }}>
        <Suspense fallback={null}>
          <AvatarModel mouthLevel={mouthLevel} />
        </Suspense>

        <ambientLight intensity={1} />
        <spotLight position={[0, 5, 5]} intensity={1.5} angle={0.3} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.5} blur={2.5} />
        <Environment preset="apartment" />
        <OrbitControls enableZoom={false} enableRotate={false} />
      </Canvas>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-[400px]">
        {/* Debug View for Audio Level */}
        <div className="text-white text-center mb-2">
            Mouth Level: {mouthLevel.toFixed(4)}
        </div>
        <VoiceRecognition onMouthLevel={setMouthLevel} />
      </div>
    </div>
  );
}