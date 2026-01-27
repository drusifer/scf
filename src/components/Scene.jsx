import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import BubbleChart from './BubbleChart';
import { useAppStore } from '../stores/useAppStore';

// A light that follows the camera
function CameraLight() {
    const { camera } = useThree();
    const lightRef = useRef();

    useFrame(() => {
        if (lightRef.current) {
            lightRef.current.position.copy(camera.position);
            // Optional: Make the light point towards the center of the scene
            lightRef.current.target.position.set(0, 0, 0);
            lightRef.current.target.updateMatrixWorld();
        }
    });

    return <directionalLight ref={lightRef} intensity={1.5} />;
}


export default function Scene() {
    const { data } = useAppStore();

    return (
        <div className="absolute inset-0 bg-black">
            <Canvas camera={{ position: [0, 0, 3000], fov: 45, far: 50000 }}>
                {/* Fog is pushed way out to prevent darkening at reasonable distances */}
                <fog attach="fog" args={['#050510', 8000, 25000]} />

                <ambientLight intensity={0.8} />
                <pointLight position={[5000, 5000, 5000]} intensity={3} />
                <pointLight position={[-5000, -5000, -5000]} intensity={2.5} />
                <pointLight position={[5000, -5000, 2000]} intensity={1.5} />

                {/* Add a light that follows the camera */}
                <CameraLight />

                {/* Stars adjusted */}
                <Stars radius={15000} depth={100} count={5000} factor={8} saturation={0} fade speed={1} />

                <Suspense fallback={null}>
                    {data.length > 0 && <BubbleChart data={data} />}
                    <Environment preset="city" />
                </Suspense>

                {/* Controls with damping to prevent drifting */}
                <OrbitControls minDistance={50} maxDistance={20000}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={false}
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
}
