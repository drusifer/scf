import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as d3 from 'd3';
import { useAppStore } from '../stores/useAppStore';
import * as THREE from 'three';

import { forceSimulation, forceCollide, forceLink, forceCluster } from 'd3-force-3d';

// Color scales
const colorScales = {
    domain: d3.scaleOrdinal(d3.schemeSpectral[11]),
    pptdf: d3.scaleOrdinal(d3.schemeCategory10),
    nist_csf: d3.scaleOrdinal(d3.schemeSet2)
};

// Helper for 3D radius - volume based scaling
const getRadiusFromWeight = (weight, scale = 20) => Math.pow(weight, 1 / 3) * scale;

// Helper to parse mapping string into a tree (Regime Shell -> Flat Mappings)
const parseMappings = (control, selectedRegimes) => {
    const regimes = [];
    const controlWeight = control.weight || 1;
    const allLeaves = [];

    control.mappings.forEach(m => {
        // Only include if it's in the selected regimes
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

    // DISTRIBUTE WEIGHT: Divide the control's total weight among all visible mapping leaves
    if (allLeaves.length > 0) {
        const weightPerLeaf = controlWeight / allLeaves.length;
        allLeaves.forEach(leaf => {
            leaf.value = weightPerLeaf;
        });
    }

    return regimes;
};

// A new, more robust 3D layout generator for hierarchical data
const apply3DLayout = (rootNode) => {
    // 1. Recursively calculate the radius and position for each node, starting from the leaves.
    const processNode = (node) => {
        // If it's a leaf node, its radius is based on its own value.
        if (!node.children || node.children.length === 0) {
            node.r = getRadiusFromWeight(node.value || 1);
            // Initialize local position properties for leaves
            node.lx = node.ly = node.lz = 0;
            return;
        }

        // If it's a parent, recursively process its children first.
        node.children.forEach(processNode);

        // Now that all children have their final radii, we can arrange them.
        const allChildren = node.children;

        // Give all children an initial random 3D position to avoid clumping at the start.
        const spread = Math.cbrt(allChildren.length) * 50;
        allChildren.forEach(d => {
            d.x = (Math.random() - 0.5) * spread;
            d.y = (Math.random() - 0.5) * spread;
            d.z = (Math.random() - 0.5) * spread;
        });

        // 2. Create a force simulation for the *immediate children only*.
        const simulation = forceSimulation(allChildren, 3)
            // Force 1: Collision detection. Prevents any two bubbles from overlapping.
            // Use a generous padding to ensure visible spacing.
            .force("collide", forceCollide(d => d.r + 10).strength(0.8))
            // Force 2: A force that pulls all children towards the center (0,0,0)
            .force("center", d3.forceCenter().strength(0.05))
            .stop();

        // 3. Run the simulation for enough ticks to let it settle.
        for (let i = 0; i < 400; i++) {
            simulation.tick();
        }

        // 4. After the simulation, set the final local positions and calculate the new parent radius.
        let maxDist = 0;
        node.children.forEach(child => {
            // The simulation gives absolute x,y,z relative to the simulation's center.
            // We store these as the child's local coordinates relative to the parent.
            child.lx = child.x || 0;
            child.ly = child.y || 0;
            child.lz = child.z || 0;
            // Calculate the maximum distance from the parent's center to a child's outer edge.
            const dist = Math.sqrt(child.lx ** 2 + child.ly ** 2 + child.lz ** 2) + child.r;
            if (dist > maxDist) maxDist = dist;
        });

        // The parent's new radius is the one that can enclose all its children, plus some padding.
        const padding = node.depth === 0 ? 10 : 5; // Less padding for deeper nodes
        node.r = maxDist + padding;
    };

    // Start the recursive process from the root.
    processNode(rootNode);
};

// Single bubble component - recursive for true hierarchical rendering
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
    maxRenderDepth = 3, // Increased to reach Regimes from Root
    isFocusRoot = false
}) => {
    // Debug logging for the focus root
    if (isFocusRoot) {
        console.log(`[BubbleNode] Rendering Focus Root: "${node.data.name}", Children: ${node.children?.length}, Radius: ${node.r.toFixed(1)}`);
    }
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

    // Show label only if it's a top-level bubble and big enough to not overlap
    let showLabel = isTopLevel && node.r > (focusedNode.r / 25);


    if (isRoot) {
        color = '#ffffff';
        opacity = 0.01;
        showLabel = false;
    } else if (isDomain) {
        color = '#ffffff';
        opacity = isFocused ? 0.01 : 0.04;
    } else if (isControl) {
        if (hasChildren) {
            color = '#ffffff';
            opacity = isSelected || isHovered ? 0.15 : 0.06;
        } else {
            color = '#ffffff';
            opacity = 1.0;
        }
    } else if (isRegime) {
        color = '#ffffff';
        opacity = 0.03;
    } else {
        // Mapping leaves
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

    // Use local coordinates lx, ly, lz, but center the focus root at origin
    const position = isFocusRoot ? [0, 0, 0] : [node.lx || 0, node.ly || 0, node.lz || 0];

    return (
        <group position={position}>
            {/* Mesh for the bubble itself */}
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

            {/* Label */}
            {showLabel && (
                <Text
                    position={[0, 0, node.r + 1]} // Slightly outside the surface
                    fontSize={labelSize}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={1}
                    curveRadius={node.r}
                >
                    {labelText}
                </Text>
            )}

            {/* Recursively render children if within depth limit */}
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

// Internal component to handle camera transitions
function CameraHandler({ targetRadius }) {
    const { camera } = useThree();

    useFrame((state, delta) => {
        // Target distance: enough to see the whole bubble (r * 2.5 or so for 45 deg FOV)
        let targetZ = Math.max(targetRadius * 3.5, 50);
        // Clamp the z position to prevent drifting too far
        targetZ = Math.min(targetZ, 10000); 

        // Smoothly interp camera Z
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 2);

        // Ensure camera stays looking at origin (where focused node is centered)
        camera.lookAt(0, 0, 0);
    });

    return null;
}

export default function BubbleChart({ data }) {
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
        getRegimeColor
    } = useAppStore();

    // transform flat data into single deep hierarchy
    const rootNode = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Combined filtering logic
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

        console.log("Building Deep Hierarchy for", filteredData.length, "controls. Selected Regimes:", selectedRegimes.length);

        const getGroupingValue = (d, grouping) => {
            if (grouping === 'domain') {
                return d.domain;
            }
            if (grouping === 'pptdf') {
                return d.pptdf;
            }
            if (grouping === 'nist_csf') {
                const nistCsfMapping = d.mappings.find(m => m.regime === 'NIST CSF Function Grouping');
                return nistCsfMapping ? nistCsfMapping.value : 'Uncategorized';
            }
            return 'Uncategorized';
        };

        // Level 1: Domains
        const grouped = d3.group(filteredData, d => getGroupingValue(d, grouping) || 'Uncategorized');

        const children = Array.from(grouped).map(([key, controls]) => {
            return {
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
                        weight: c.weight || 1, // Use CSV weight
                        children: regimeChildren
                    };
                })
            };
        });

        const hierarchyData = {
            name: "Secure Controls Framework",
            type: "root",
            children: children
        };

        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.weight || d.value || 0) // Sum control weights and mapped values
            .sort((a, b) => b.value - a.value);

        // Apply true 3D layout!
        apply3DLayout(root);

        console.log("3D Hierarchy Processed:", {
            name: root.data.name,
            radius: root.r,
            depth: root.height,
            childCount: root.children?.length
        });

        return root;

    }, [data, grouping, searchQuery, selectedRegimes, onlyShowMapped]);

    // Find the focused node based on focusedNodePath
    const focusedNode = useMemo(() => {
        if (!rootNode) return null;
        if (focusedNodePath.length === 0) return rootNode;

        let current = rootNode;
        for (const name of focusedNodePath) {
            const child = current.children?.find(c => c.data.name === name);
            if (!child) {
                console.warn("Could not find child with name:", name);
                return rootNode; // Fall back to root if path is invalid
            }
            current = child;
        }
        return current;
    }, [rootNode, focusedNodePath]);

    // Handle zoom - find the outermost zoomable bubble (direct child of focus) from clicked node
    const handleZoom = (clickedNode) => {
        if (!focusedNode || !focusedNode.children) return;

        // If the clicked node IS the focused node itself, do nothing
        if (clickedNode === focusedNode) return;

        // Walk up the ancestor chain from clickedNode to find which direct child of focusedNode contains it
        let current = clickedNode;
        while (current) {
            // Check if current is a direct child of focusedNode
            if (focusedNode.children.includes(current)) {
                // Found the outermost zoomable ancestor - zoom into it
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
        <group position={[0, 0, 0]}>
            {/* Automatic camera management */}
            <CameraHandler targetRadius={focusedNode.r} />

            {/*
               START RECURSIVE RENDER
               We render the focusedNode as the local origin (0,0,0)
               and it will recursively render its descendants using their relative lx/ly/lz properties.
            */}
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
                isFocusRoot={true} // Special flag to ignore node.lx during world-centering
            />
        </group>
    );
}
