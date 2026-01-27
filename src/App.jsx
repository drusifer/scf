import React, { useEffect } from 'react';
import Scene from './components/Scene';
import Header from './components/Header';
import HUD from './components/HUD';
import Sidebar from './components/Sidebar';
import { useAppStore } from './stores/useAppStore';

function App() {
  const { loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans text-white selection:bg-blue-500 selection:text-white">
      <Header />
      <Sidebar />
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
      <HUD />
    </div>
  );
}

export default App;
