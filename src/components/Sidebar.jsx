import { useState, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';

// Recursive Tree Node
const TreeNode = ({ node, level = 0, onSelect, selectedId, hoveredId }) => {
    const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand top-level

    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === selectedId;
    const isHovered = node.id === hoveredId;

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleClick = (e) => {
        e.stopPropagation();
        onSelect(node);
    };

    return (
        <div style={{ paddingLeft: `${level > 0 ? 12 : 0}px` }} className="tree-node-container">
            <div
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-white/10 rounded transition-colors ${isSelected ? 'bg-blue-500/30 text-blue-200' : ''} ${isHovered ? 'bg-white/5' : ''}`}
                onClick={handleClick}
            >
                {hasChildren && (
                    <span onClick={handleToggle} className="mr-2 text-xs opacity-70 w-4 text-center hover:text-white">{isExpanded ? '▼' : '▶'}</span>
                )}
                {!hasChildren && <span className="w-6" />}
                <span className={`text-sm ${level === 0 ? 'font-semibold text-gray-300' : 'text-gray-400'}`}>{node.name || node.id || node.key}</span>
                {hasChildren && <span className="ml-auto text-xs text-gray-600">{node.children.length}</span>}
            </div>
            {isExpanded && hasChildren && (
                <div className="border-l border-white/10 ml-2">
                    {node.children.map((child, i) => (
                        <TreeNode key={`${child.id || child.name}-${i}`} node={child} level={level + 1} onSelect={onSelect} selectedId={selectedId} hoveredId={hoveredId} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Detail Panel for a single selected control
const DetailPanel = ({ control, onBack, getRegimeColor }) => {
    if (!control) return null;
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-800 bg-black/20">
                <button onClick={onBack} className="text-sm text-blue-400 hover:text-blue-300 mb-2">&larr; Back to Filters & Hierarchy</button>
                <h3 className="font-bold text-lg text-white break-words">{control.id}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="mb-4">
                    <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Description</div>
                    <p className="text-gray-300">{control.description}</p>
                </div>
                <div className="flex space-x-8 mb-4">
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Relative Weight</div>
                        <p className="text-2xl font-semibold text-blue-300">{control.weight}</p>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-1">PPTDF</div>
                        <p className="text-gray-300">{control.pptdf}</p>
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase mb-2">Framework Mappings ({control.mappings.length})</div>
                    <div className="space-y-2">
                        {control.mappings.slice().sort((a, b) => a.regime.localeCompare(b.regime)).map(m => (
                            <div key={m.regime} className="p-2 bg-black/20 rounded-md border-l-2" style={{ borderColor: getRegimeColor(m.regime) }}>
                                <div className="font-semibold text-gray-300 text-sm">{m.regime}</div>
                                <div className="text-xs text-gray-400 break-all pt-1">{m.value.split('\n').join(', ')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Sidebar() {
    const { data, grouping, setGrouping, searchQuery, selectedControlId, setSelectedControlId, hoveredNode, onlyShowMapped, setOnlyShowMapped, selectedRegimes, toggleRegime, getAvailableRegimes, getRegimeColor, collisionPadding, setCollisionPadding, cameraDistance, setCameraDistance } = useAppStore();
    const [isOpen, setIsOpen] = useState(true);
    const [regimeSearch, setRegimeSearch] = useState('');
    const [regimesExpanded, setRegimesExpanded] = useState(true);

    const availableRegimes = useMemo(() => getAvailableRegimes(), [data]);
    const selectedControl = useMemo(() => data.find(c => c.id === selectedControlId), [data, selectedControlId]);

    const filteredRegimes = useMemo(() => {
        return availableRegimes
            .filter(r => r.toLowerCase().includes(regimeSearch.toLowerCase()))
            .sort((a, b) => {
                const aIsSelected = selectedRegimes.includes(a);
                const bIsSelected = selectedRegimes.includes(b);
                if (aIsSelected && !bIsSelected) return -1;
                if (!aIsSelected && bIsSelected) return 1;
                return a.localeCompare(b);
            });
    }, [availableRegimes, regimeSearch, selectedRegimes]);

    const treeData = useMemo(() => {
        if (!data) return [];
        const filteredData = data.filter(c => {
            const query = searchQuery.toLowerCase();
            const matchesQuery = query === '' || c.id.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
            const isMapped = c.mappings?.some(m => selectedRegimes.includes(m.regime));
            const matchesRegime = !onlyShowMapped || isMapped;
            return matchesQuery && matchesRegime;
        });

        const getGroupingValue = (d, grp) => {
            if (grp === 'domain') return d.domain;
            if (grp === 'pptdf') return d.pptdf;
            if (grp === 'nist_csf') {
                const mapping = d.mappings.find(m => m.regime === 'NIST CSF Function Grouping');
                return mapping ? mapping.value : 'Uncategorized';
            }
            return 'Uncategorized';
        };

        const groups = {};
        filteredData.forEach(control => {
            const groupKey = getGroupingValue(control, grouping) || 'Uncategorized';
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(control);
        });

        return Object.keys(groups).sort().map(key => ({
            name: key,
            id: `group-${key}`,
            children: groups[key].map(c => ({ name: c.id, id: c.id }))
        }));
    }, [data, grouping, searchQuery, onlyShowMapped, selectedRegimes]);

    const GroupingButton = ({ id, label }) => (
        <button onClick={() => setGrouping(id)} className={`px-3 py-1 text-sm rounded-md transition-colors w-full ${grouping === id ? 'bg-blue-600 text-white font-semibold' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}>
            {label}
        </button>
    );

    return (
        <>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="fixed left-4 top-[8rem] z-50 p-3 bg-black/60 backdrop-blur-md text-white rounded-xl shadow-lg border border-white/10 hover:bg-white/10 transition-all font-medium text-sm">
                    {selectedControlId ? '☰ Details' : '☰ Filters & Hierarchy'}
                </button>
            )}
            <div className={`fixed left-4 top-[8rem] bottom-4 z-40 w-96 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
                {selectedControl ? (
                    <DetailPanel control={selectedControl} onBack={() => setSelectedControlId(null)} getRegimeColor={getRegimeColor} />
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
                            <h2 className="font-bold text-lg text-white">Filters & Hierarchy</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            <div className="p-3 border-b border-gray-800">
                                <div className="text-xs text-gray-400 mb-2 px-1 font-semibold uppercase">Group By</div>
                                <div className="flex justify-between bg-black/20 p-1 rounded-lg space-x-1">
                                    <GroupingButton id="domain" label="Domain" />
                                    <GroupingButton id="pptdf" label="PPTDF" />
                                    <GroupingButton id="nist_csf" label="NIST CSF" />
                                </div>
                            </div>
                            <div className="p-3 border-b border-gray-800">
                                <div className="text-xs text-gray-400 mb-2 px-1 font-semibold uppercase">Visualization Settings</div>
                                <div className="px-1">
                                    <label className="text-sm text-gray-300">Bubble Separation</label>
                                    <input type="range" min="-50" max="150" value={collisionPadding} onChange={(e) => setCollisionPadding(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                                <div className="px-1 mt-2">
                                    <label className="text-sm text-gray-300">Camera Distance</label>
                                    <input type="range" min="100" max="15000" value={cameraDistance} onChange={(e) => setCameraDistance(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>
                            <div className="p-3 border-b border-gray-800">
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => setRegimesExpanded(!regimesExpanded)}>
                                    <div className="text-xs text-gray-400 font-semibold uppercase">Compliance Regimes ({selectedRegimes.length})</div>
                                    <span className="text-xs">{regimesExpanded ? '▲' : '▼'}</span>
                                </div>
                                {regimesExpanded && (
                                    <div className="mt-3">
                                        <label className="flex items-center space-x-2 mb-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                                            <input type="checkbox" checked={onlyShowMapped} onChange={(e) => setOnlyShowMapped(e.target.checked)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                                            <span className="text-sm text-gray-300">Show only controls mapped to selection</span>
                                        </label>
                                        <input type="text" placeholder={`Search ${availableRegimes.length} regimes...`} value={regimeSearch} onChange={(e) => setRegimeSearch(e.target.value)} className="w-full bg-black/20 p-2 rounded-md text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                            {filteredRegimes.map(regime => (
                                                <label key={regime} className="flex items-center space-x-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                                                    <input type="checkbox" checked={selectedRegimes.includes(regime)} onChange={() => toggleRegime(regime)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500" />
                                                    <span className="text-sm text-gray-400">{regime}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-2">
                                <div className="px-2 py-2 text-xs text-gray-500 bg-black/10">
                                    {treeData.reduce((acc, curr) => acc + curr.children.length, 0)} Controls shown
                                </div>
                                {treeData.map(group => (
                                    <TreeNode key={group.id} node={group} onSelect={(node) => { if (data.find(c => c.id === node.id)) setSelectedControlId(node.id); }} selectedId={selectedControlId} hoveredId={hoveredNode} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}


