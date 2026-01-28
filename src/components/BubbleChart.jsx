import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as d3 from 'd3';
import { useAppStore } from '../stores/useAppStore';
import * as THREE from 'three';
import { forceSimulation, forceCollide, forceLink, forceCluster } from 'd3-force-3d';

// Helper for 3D radius - volume based scaling
const getRadiusFromWeight = (weight, scale = 15) => Math.pow(weight, 1 / 3) * scale;

// Helper to parse mapping string into a tree
const parseMappings = (control, selectedRegimes) => {
    const regimes = [];
    const controlWeight = control.weight || 1;
    const allLeaves = [];

    control.mappings.forEach(m => {
        if (selectedRegimes && !selectedRegimes.includes(m.regime)) return;

        let regimeNode = regimes.find(n => n.name === m.regime);
        if (!regimeNode) {
            regimeNode = {
                name: m.regime,
                type: 'regime',
                children: [],
                controlId: control.id
            };
            regimes.push(regimeNode);
        }

        const rawValues = m.value.split('\n').filter(v => v.trim().length > 0);
        rawValues.forEach(val => {
            const leaf = {
                name: val.trim(),
                type: 'mapping-leaf',
                regime: m.regime,
                controlId: control.id
            };
            regimeNode.children.push(leaf);
            allLeaves.push(leaf);
        });
    });

    if (allLeaves.length > 0) {
        const weightPerLeaf = controlWeight / allLeaves.length;
        allLeaves.forEach(leaf => {
            leaf.value = weightPerLeaf;
        });
    }

    return regimes;
};

const apply3DLayout = (rootNode, collisionPadding) => {
    const nodes = rootNode.descendants();
    const links = rootNode.links();

    nodes.forEach(node => {
        node.r = getRadiusFromWeight(node.value || 1);
    });

    const simulation = forceSimulation(nodes, 3)
        .force("link", forceLink(links).id(d => d.id).strength(0.1))
        .force("collide", forceCollide(d => d.r + collisionPadding).strength(0.8))
        .force("cluster", forceCluster().centers(d => d.parent).strength(0.9))
        .force("center", d3.forceCenter().strength(0.01))
        .stop();

    for (let i = 0; i < 150; i++) {
        simulation.tick();
    }

    nodes.forEach(node => {
        if (node.parent) {
            node.lx = node.x - node.parent.x;
            node.ly = node.y - node.parent.y;
            node.lz = node.z - node.parent.z;
        } else {
            node.lx = node.x;
            node.ly = node.y;
            node.lz = node.z;
        }
    });

    nodes.forEach(node => {
        if (node.children) {
            let maxDist = 0;
            node.children.forEach(child => {
                const dist = Math.sqrt(child.lx ** 2 + child.ly ** 2 + child.lz ** 2) + child.r;
                if (dist > maxDist) maxDist = dist;
            });
            node.r = maxDist;
        }
    });
};

const BubbleNode = React.memo(({
    node,
    onClick,
    onHover,
    onZoom,
    selectedId,
    hoveredId,
    focusedNode,
    rootValue,
    getRegimeColor,
    currentDepth = 0,
    maxRenderDepth = 4,
    isFocusRoot = false
}) => {
    const isControl = node.data.type === 'control';
    const isRegime = node.data.type === 'regime';
    const isDomain = node.data.type === 'domain';
    const isRoot = node.data.type === 'root';
    const hasChildren = node.children && node.children.length > 0;

    const isSelected = selectedId === node.data.id;
    const isHovered = hoveredId === node.data.id || (node.data.path && hoveredId === node.data.path);
    const isFocused = focusedNode === node;
    const isTopLevel = node.parent === focusedNode;

    let color = '#ffffff';
    let opacity = 0.1;
    let labelSize = Math.max(node.r / 8, 10);

    let showLabel = isTopLevel && node.r > (focusedNode.r / 25);

    if (isRoot) {
        color = '#ffffff';
        opacity = 0.01;
        showLabel = false;
    } else if (isDomain) {
        color = '#ffffff';
        opacity = isFocused ? 0.05 : 0.1;
    } else if (isControl) {
        if (hasChildren) {
            color = '#ffffff';
            opacity = isSelected || isHovered ? 0.25 : 0.15;
        } else {
            color = '#ffffff';
            opacity = 1.0;
        }
    } else if (isRegime) {
        color = '#ffffff';
        opacity = 0.08;
    } else {
        let regimeName = node.data.regime;
        if (!regimeName) {
            let current = node;
            while (current && current.data) {
                if (current.data.type === 'regime') {
                    regimeName = current.data.name;
                    break;
                }
                current = current.parent;
            }
        }
        color = regimeName ? getRegimeColor(regimeName) : '#00ffee';
        opacity = 1.0;
        showLabel = false;
    }

    const handleClick = (e) => {
        e.stopPropagation();
        if (focusedNode && node === focusedNode) return;
        if (onZoom) onZoom(node);
        if (isControl && onClick) onClick(node.data.id);
    };

    const isClickable = focusedNode !== node;
    const percentage = rootValue ? ((node.value / rootValue) * 100).toFixed(1) : 0;
    const labelText = (isDomain || isControl)
        ? `${node.data.name} (${percentage}%)`
        : node.data.name;

    const position = isFocusRoot ? [0, 0, 0] : [node.x || 0, node.y || 0, node.z || 0];

    return (
        <group position={position}>
            <mesh
                onClick={isClickable ? handleClick : undefined}
                onPointerOver={isClickable ? (e) => {
                    e.stopPropagation();
                    if (onHover) onHover(node.data.id || node.data.name);
                    document.body.style.cursor = hasChildren ? 'pointer' : 'default';
                } : undefined}
                onPointerOut={isClickable ? (e) => {
                    if (onHover) onHover(null);
                    document.body.style.cursor = 'default';
                } : undefined}
            >
                <dodecahedronGeometry args={[node.r, 0]} />
                <meshStandardMaterial
                    color={color}
                    transparent={hasChildren && opacity < 1.0}
                    opacity={opacity}
                    depthWrite={!hasChildren}
                    side={hasChildren ? THREE.BackSide : THREE.DoubleSide}
                    metalness={0.4}
                    roughness={0.4}
                    emissive={color}
                    emissiveIntensity={isSelected || isFocused ? 0.5 : 0.15}
                />
            </mesh>

            {showLabel && (
                <Text
                    position={[0, 0, node.r + 1]}
                    fontSize={labelSize}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={1}
                    curveRadius={-node.r}
                >
                    {labelText}
                </Text>
            )}

            {hasChildren && currentDepth < maxRenderDepth && node.children.map((child, i) => (
                <BubbleNode
                    key={i}
                    node={child}
                    onClick={onClick}
                    onHover={onHover}
                    onZoom={onZoom}
                    selectedId={selectedId}
                    hoveredId={hoveredId}
                    focusedNode={focusedNode}
                    rootValue={rootValue}
                    getRegimeColor={getRegimeColor}
                    currentDepth={currentDepth + 1}
                    maxRenderDepth={maxRenderDepth}
                />
            ))}
        </group>
    );
});

function BubbleChart({ data }) {
    const {
        grouping,
        searchQuery,
        setSelectedControlId,
        selectedControlId,
        hoveredNode,
        setHoveredNode,
        focusedNodePath,
        zoomIn,
        selectedRegimes,
        onlyShowMapped,
        getRegimeColor,
        collisionPadding
    } = useAppStore();

    const rootNode = useMemo(() => {
        if (!data || data.length === 0) return null;

        const filteredData = data.filter(c => {
            const query = searchQuery.toLowerCase();
            const matchesQuery = query === '' ||
                c.id.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query);

            const isMapped = c.mappings && c.mappings.some(m => selectedRegimes.includes(m.regime));
            const matchesRegime = !onlyShowMapped || isMapped;

            return matchesQuery && matchesRegime;
        });

        if (filteredData.length === 0 && data.length > 0) {
            console.warn("Filtering hidden all controls. Check search query or regime selection.");
        }

        const getGroupingValue = (d, grouping) => {
            if (grouping === 'domain') return d.domain;
            if (grouping === 'pptdf') return d.pptdf;
            if (grouping === 'nist_csf') {
                const nistCsfMapping = d.mappings.find(m => m.regime === 'NIST CSF Function Grouping');
                return nistCsfMapping ? nistCsfMapping.value : 'Uncategorized';
            }
            return 'Uncategorized';
        };

        const grouped = d3.group(filteredData, d => getGroupingValue(d, grouping) || 'Uncategorized');

        const children = Array.from(grouped).map(([key, controls]) => ({
            name: key,
            type: 'domain',
            children: controls.map(c => {
                const regimeChildren = parseMappings(c, selectedRegimes);
                return {
                    name: c.id,
                    type: 'control',
                    id: c.id,
                    domain: c.domain,
                    description: c.description,
                    weight: c.weight || 1,
                    children: regimeChildren
                };
            })
        }));

        const hierarchyData = {
            name: "Secure Controls Framework",
            type: "root",
            children: children
        };

        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.weight || d.value || 0)
            .sort((a, b) => b.value - a.value);

        apply3DLayout(root, collisionPadding);

        return root;
    }, [data, grouping, searchQuery, selectedRegimes, onlyShowMapped, collisionPadding]);

    const focusedNode = useMemo(() => {
        if (!rootNode) return null;
        if (focusedNodePath.length === 0) return rootNode;

        let current = rootNode;
        for (const name of focusedNodePath) {
            const child = current.children?.find(c => c.data.name === name);
            if (!child) {
                return rootNode;
            }
            current = child;
        }
        return current;
    }, [rootNode, focusedNodePath]);

    const handleZoom = (clickedNode) => {
        if (!focusedNode || !focusedNode.children) return;
        if (clickedNode === focusedNode) return;

        let current = clickedNode;
        while (current) {
            if (focusedNode.children.includes(current)) {
                if (current.children && current.children.length > 0) {
                    zoomIn(current.data.name);
                }
                return;
            }
            current = current.parent;
        }
    };

    if (!focusedNode) return null;

    return (
        <group>
            <BubbleNode
                node={focusedNode}
                onClick={setSelectedControlId}
                onHover={setHoveredNode}
                onZoom={handleZoom}
                selectedId={selectedControlId}
                hoveredId={hoveredNode}
                focusedNode={focusedNode}
                rootValue={rootNode.value}
                getRegimeColor={getRegimeColor}
                isFocusRoot={true}
            />
        </group>
    );
}

export default React.memo(BubbleChart);