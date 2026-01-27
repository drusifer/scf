import React from 'react';
import { useAppStore } from '../stores/useAppStore';

export default function HUD() {
    const {
        focusedNodePath, zoomOut, zoomToRoot
    } = useAppStore();

    const isZoomedIn = focusedNodePath.length > 0;
    const currentName = isZoomedIn ? focusedNodePath[focusedNodePath.length - 1] : "Secure Controls Framework";

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top Center Title & Breadcrumbs */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 max-w-[60%]">
                <div className="flex items-center gap-2 pointer-events-auto">
                    {focusedNodePath.length > 0 && (
                        <button
                            onClick={zoomToRoot}
                            className="p-2 bg-black/40 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white border border-white/5 backdrop-blur-md transition-all flex-shrink-0"
                            title="Reset to Root"
                        >
                            🏠
                        </button>
                    )}
                    <h1 className={`${currentName.length > 40 ? 'text-lg md:text-xl' :
                        currentName.length > 20 ? 'text-xl md:text-2xl' :
                            'text-2xl md:text-3xl'
                        } font-light text-white tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] text-center break-words max-w-full leading-tight transition-all duration-300`}>
                        {currentName}
                    </h1>
                </div>

                {isZoomedIn && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/5 pointer-events-auto shadow-inner">
                        <button
                            onClick={zoomToRoot}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-tighter"
                        >
                            SCF
                        </button>
                        {focusedNodePath.map((name, i) => (
                            <React.Fragment key={i}>
                                <span className="text-gray-600 text-[10px]">/</span>
                                <button
                                    onClick={() => useAppStore.getState().setFocusedNodePath(focusedNodePath.slice(0, i + 1))}
                                    className={`text-[10px] uppercase tracking-tighter transition-all ${i === focusedNodePath.length - 1
                                        ? 'text-gray-300 font-bold cursor-default'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {name.length > 20 ? name.substring(0, 17) + '...' : name}
                                </button>
                            </React.Fragment>
                        ))}
                        <div className="w-[1px] h-3 bg-white/10 mx-1" />
                        <button
                            onClick={zoomOut}
                            className="text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-tighter"
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
