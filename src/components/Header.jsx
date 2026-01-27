import React from 'react';
import { useAppStore } from '../stores/useAppStore';

export default function Header() {
    const { searchQuery, setSearchQuery } = useAppStore();

    return (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-10 flex justify-between items-start">
            {/* Left side: Title */}
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl pointer-events-auto">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    SCF 3D Visualizer
                </h1>
                <p className="text-xs text-gray-300 tracking-wider font-mono mt-1">
                    SECURE CONTROLS FRAMEWORK 2025.4
                </p>
            </div>

            {/* Right side: Search */}
            <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl pointer-events-auto">
                <input
                    type="text"
                    placeholder="Search controls..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-400 w-64 focus:outline-none focus:ring-0"
                />
            </div>
        </div>
    );
}
