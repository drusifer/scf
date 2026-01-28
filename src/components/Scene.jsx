import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import BubbleChart from './BubbleChart';
import { useAppStore } from '../stores/useAppStore';
import * as THREE from 'three';

function Camera() {
    const cameraRef = useRef();
    const { cameraDistance } = useAppStore();

    useFrame((state) => {
        state.camera.position.lerp(new THREE.Vector3(state.camera.position.x, state.camera.position.y, cameraDistance), 0.1);
        state.camera.updateProjectionMatrix();
    });

    return null;
}

// A light that follows the camera
function CameraLight() {
    const lightRef = useRef();
    useFrame(({ camera }) => {
        if (lightRef.current) {
            lightRef.current.position.copy(camera.position);
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
                <fog attach="fog" args={['#050510', 15000, 25000]} />

                <ambientLight intensity={0.8} />
                <pointLight position={[5000, 5000, 5000]} intensity={3} />
                <pointLight position={[-5000, -5000, -5000]} intensity={2.5} />
                <pointLight position={[5000, -5000, 2000]} intensity={1.5} />

                <CameraLight />
                <Camera />

                <Stars radius={15000} depth={100} count={5000} factor={8} saturation={0} fade speed={1} />

                <Suspense fallback={null}>
                    {data.length > 0 && <BubbleChart data={data} />}
                    <Environment preset="city" />
                </Suspense>

                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    zoomSpeed={1.2}
                    panSpeed={0.8}
                    rotateSpeed={0.5}
                />
            </Canvas>
        </div>
    );
}
