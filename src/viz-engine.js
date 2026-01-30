import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from 'tween';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY, forceZ, forceCollide } from 'd3-force-3d';

export class VizEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.controls = null;

        this.nodes = [];
        this.links = [];
        this.simulation = null;
        this.nodeMeshes = new Map();
        this.nodeLabels = new Map();

        this.isLowPoly = false;
        this.selectedNode = null;
        this.currentRegimes = [];

        // Physics Settings (Sane Defaults - Loosened up)
        this.physics = {
            repulsion: -3000,
            linkDist: 500,
            boundsScale: 1.2
        };

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    updatePhysics(settings) {
        this.physics = { ...this.physics, ...settings };
        if (this.simulation) {
            // Update link distance - now reactive as multipliers
            const linkForce = this.simulation.force('link');
            if (linkForce) {
                linkForce.distance(d => {
                    const base = this.physics.linkDist;
                    if (d.target.type === 'mapping') return base * 0.1;
                    if (d.target.type === 'control') return base * 0.2;
                    if (d.target.type === 'pptdf') return base * 0.5;
                    return base;
                });
            }

            // Update charge strength with boosted default
            const chargeForce = this.simulation.force('charge');
            if (chargeForce) chargeForce.strength(this.physics.repulsion);

            // Re-warm simulation
            this.simulation.alpha(0.3).restart();
        }
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.scene.background = new THREE.Color(0x020617);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

        const pointLight = new THREE.PointLight(0x3b82f6, 1, 5000);
        pointLight.position.set(1000, 1000, 1000);
        this.scene.add(pointLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(-1, 2, 4);
        this.scene.add(dirLight);

        this.camera.position.set(0, 0, 2000);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('mousedown', (e) => {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const visibleMeshes = Array.from(this.nodeMeshes.values()).filter(m => m);
            const intersects = this.raycaster.intersectObjects(visibleMeshes);
            if (intersects.length > 0) {
                const node = intersects[0].object.userData.node;
                if (this.onNodeClick) this.onNodeClick(node);
            }
        });

        this.animate();
    }

    calculateRadius(node) {
        if (!node) return 1000;

        // Leaf nodes (mappings)
        if (node.type === 'mapping') return 12;

        // Container nodes: Radius proportional to cube root of value (aggregate weighting)
        // We use a base scale to ensure visibility and a minimum size
        const scaleFactor = 25;
        const volumeRadius = Math.pow(node.value || 1, 1 / 3) * scaleFactor;

        // Level-specific base minimums
        const minRadius = node.type === 'root' ? 1200 : (node.type === 'domain' ? 500 : (node.type === 'pptdf' ? 150 : 40));

        return Math.max(minRadius, volumeRadius);
    }

    createNodeMesh(node, isContainer = false) {
        const radius = this.calculateRadius(node);
        const geometry = this.isLowPoly ?
            new THREE.DodecahedronGeometry(radius, 0) :
            new THREE.SphereGeometry(radius, 32, 32);

        const isRegimeMatch = node.type === 'mapping' && this.currentRegimes.includes(node.regime);
        const baseColor = node.type === 'domain' ? 0x3b82f6 : (node.type === 'pptdf' ? 0x60a5fa : 0xffffff);
        const color = isRegimeMatch ? (node.regimeColor || 0xffffff) : baseColor;

        let material;
        if (isContainer) {
            // Immersive Shell Effect
            material = new THREE.MeshPhysicalMaterial({
                color: baseColor,
                transparent: true,
                opacity: 0.05, // Very faint shells when inside
                metalness: 0.1,
                roughness: 0.05,
                transmission: 0.95,
                thickness: 0.5,
                side: THREE.BackSide,
                depthWrite: false
            });
        } else {
            const isLeaf = !node.children || node.children.length === 0;
            material = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: isRegimeMatch || isLeaf ? 0.9 : 0.4,
                shininess: 100,
                emissive: isRegimeMatch ? color : 0x000000,
                emissiveIntensity: isRegimeMatch ? 0.6 : 0
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(node.x || 0, node.y || 0, node.z || 0);
        mesh.userData = { node, radius };

        // Add globe label to ALL visible nodes including root, domains, pptdfs, and mappings
        if (node.type === 'root' || node.type === 'domain' || node.type === 'pptdf' || node.type === 'control' || node.type === 'mapping') {
            this.addGlobeLabel(mesh, node.name, radius, isContainer);
        }

        return mesh;
    }

    addGlobeLabel(mesh, text, radius, isContainer) {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const fontSize = isContainer ? 180 : 120;
        ctx.font = `bold ${fontSize}px Outfit`;

        const labelText = text.slice(0, 50) + (text.length > 50 ? '...' : '');
        const metrics = ctx.measureText(labelText);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        // Draw dark pill background for legibility on white bubbles
        const paddingX = 80;
        const paddingY = 40;
        const pillWidth = textWidth + paddingX * 2;
        const pillHeight = textHeight + paddingY * 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Dark Slate-900 background
        this.roundRect(ctx, (2048 - pillWidth) / 2, (512 - pillHeight) / 2, pillWidth, pillHeight, 60, true);

        // Add a subtle border to the pill
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = isContainer ? 'rgba(255, 255, 255, 0.95)' : 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 1024, 256);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: true
        });

        const labelWidth = isContainer ? radius * 3 : radius * 2.2;
        const labelHeight = labelWidth / 4;
        const geometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
        const labelMesh = new THREE.Mesh(geometry, material);

        labelMesh.position.set(0, 0, radius * (isContainer ? 1.02 : 1.05));

        mesh.add(labelMesh);
        this.nodeLabels.set(mesh, labelMesh);
    }

    roundRect(ctx, x, y, width, height, radius, fill) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
    }

    renderHierarchy(hierarchy, maxDepth = 1, isInside = false) {
        this.clear();
        this.currentViewRoot = hierarchy;
        this.isInside = isInside;

        // If NOT inside, just show the single bubble for the hierarchy node
        if (!isInside) {
            const mesh = this.createNodeMesh(hierarchy, false);
            this.nodeMeshes.set(hierarchy.id, mesh);
            this.scene.add(mesh);
            mesh.position.set(0, 0, 0);
            this.containerMesh = mesh;
            this.nodes = [hierarchy];
            this.links = [];
            // Zoom camera to see the bubble from outside
            const r = this.calculateRadius(hierarchy);
            this.camera.position.set(0, 0, r * 4);
            this.controls.target.set(0, 0, 0);
            return;
        }

        const { nodes, links } = this.flatten(hierarchy, maxDepth);
        this.nodes = nodes;
        this.links = links;

        const parentIds = new Set(this.nodes.map(n => n.parent ? n.parent.id : null));

        // Volume-based container radius
        let childrenVolume = 0;
        this.nodes.forEach(n => {
            if (n.id !== hierarchy.id) {
                const r = this.calculateRadius(n);
                childrenVolume += (4 / 3) * Math.PI * Math.pow(r, 3);
            }
        });
        const minParentRadius = Math.pow((3 * childrenVolume) / (4 * Math.PI), 1 / 3) * 2.0;
        const parentRadius = Math.max(this.calculateRadius(hierarchy) * 2, minParentRadius);

        hierarchy.fx = 0; hierarchy.fy = 0; hierarchy.fz = 0;

        this.nodes.forEach(node => {
            const isContainer = node.id === hierarchy.id;

            // If we are "inside", do NOT render the root container mesh
            // This prevents it from blocking clicks and obscuring high-depth views
            if (isInside && isContainer) {
                this.nodeMeshes.set(node.id, null);
                this.containerMesh = null;
                return;
            }

            const mesh = this.createNodeMesh(node, isContainer);

            if (isContainer) {
                // Scale container mesh to be significantly larger than children
                mesh.scale.setScalar(parentRadius / this.calculateRadius(node));
                this.containerMesh = mesh;
            }

            this.nodeMeshes.set(node.id, mesh);
            this.scene.add(mesh);
            mesh.position.set(node.x || 0, node.y || 0, node.z || 0);
        });

        this.simulation = forceSimulation(this.nodes, 3)
            .force('link', forceLink(this.links).id(d => d.id).distance(d => {
                const base = this.physics.linkDist;
                if (d.target.type === 'mapping') return base * 0.1;
                if (d.target.type === 'control') return base * 0.2;
                if (d.target.type === 'pptdf') return base * 0.5;
                return base;
            }).strength(0.5))
            .force('charge', forceManyBody().strength(this.physics.repulsion))
            .force('center', forceCenter(0, 0, 0))
            .force('collision', forceCollide().radius(d => this.calculateRadius(d) * (d.id === hierarchy.id ? 0 : 1.1)).strength(0.7))
            .force('bounding', this.forceBounding(parentRadius, hierarchy))
            .on('tick', () => {
                this.nodes.forEach(node => {
                    const mesh = this.nodeMeshes.get(node.id);
                    if (mesh && node.id !== hierarchy.id) {
                        mesh.position.set(node.x, node.y, node.z);
                    }
                });
            });

        // Zoom setup for "inside" view
        this.camera.position.set(0, 0, parentRadius * 0.5);
        this.controls.target.set(0, 0, 0);
    }

    async transitionToNode(node, maxDepth) {
        if (!node) return;

        // Find current label to animate
        const currentMesh = this.nodeMeshes.get(node.id);
        const label = currentMesh ? this.nodeLabels.get(currentMesh) : null;

        if (label) {
            // "Fly into breadcrumbs" - animate label up and fade
            new TWEEN.Tween(label.position)
                .to({ y: 1000, z: 200 }, 600)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();

            new TWEEN.Tween(label.material)
                .to({ opacity: 0 }, 600)
                .onComplete(() => {
                    // Clean up label after animation
                    if (label.parent) label.parent.remove(label);
                })
                .start();
        }

        // Phase 1: Zoom towards the node
        const targetRadius = this.calculateRadius(node);
        const endPos = new THREE.Vector3(0, 0, targetRadius * 0.1); // Fly through surface

        return new Promise(resolve => {
            new TWEEN.Tween(this.camera.position)
                .to({ x: endPos.x, y: endPos.y, z: endPos.z }, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(() => {
                    const dist = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
                    this.renderer.domElement.style.opacity = Math.max(0.1, dist / (targetRadius * 1.5));
                })
                .onComplete(() => {
                    this.renderHierarchy(node, maxDepth, true);
                    this.renderer.domElement.style.opacity = 1;
                    resolve();
                })
                .start();
        });
    }

    forceBounding(parentRadius, viewRoot) {
        return (alpha) => {
            const boundsScale = this.physics.boundsScale || 1.2;

            for (const node of this.nodes) {
                if (node.fx !== undefined) continue; // Skip fixed origin

                // Determine relative center and radius
                let centerX = 0, centerY = 0, centerZ = 0;
                let limitRadius = parentRadius;

                // If the node has a parent in the simulation, it should be bounded by it
                if (node.parent && node.parent.id !== viewRoot.id) {
                    centerX = node.parent.x || 0;
                    centerY = node.parent.y || 0;
                    centerZ = node.parent.z || 0;
                    limitRadius = this.calculateRadius(node.parent);
                }

                const r = this.calculateRadius(node);
                const maxR = limitRadius * boundsScale - r;

                const dx = node.x - centerX;
                const dy = node.y - centerY;
                const dz = node.z - centerZ;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq > maxR * maxR) {
                    const dist = Math.sqrt(distSq);
                    const ratio = maxR / dist;
                    const strength = 0.2 * alpha;

                    node.vx += (dx * ratio - dx) * strength;
                    node.vy += (dy * ratio - dy) * strength;
                    node.vz += (dz * ratio - dz) * strength;
                }
            }
        };
    }

    flatten(root, maxDepth = 1) {
        const nodes = [];
        const links = [];
        const seen = new Set();

        const traverse = (node, depth = 0, parent = null) => {
            if (seen.has(node.id)) return;

            // FILTER: If this is a mapping, only include it if it's in the current regimes
            if (node.type === 'mapping') {
                if (!this.currentRegimes || !this.currentRegimes.includes(node.regime)) {
                    return;
                }
            }

            // For simulation we need x,y,z - seed near parent to prevent "explosions"
            if (node.x === undefined) node.x = (parent ? parent.x : 0) + (Math.random() - 0.5) * 50;
            if (node.y === undefined) node.y = (parent ? parent.y : 0) + (Math.random() - 0.5) * 50;
            if (node.z === undefined) node.z = (parent ? parent.z : 0) + (Math.random() - 0.5) * 50;

            nodes.push(node);
            seen.add(node.id);

            if (parent) {
                links.push({
                    source: parent.id,
                    target: node.id
                });
            }

            if (depth < maxDepth && node.children) {
                node.children.forEach(child => traverse(child, depth + 1, node));
            }
        };

        // Don't include the root node itself in the flat list if it's the anchor, 
        // but we need it for links. Actually, include it so forceCenter works.
        traverse(root);
        return { nodes, links };
    }

    zoomToNode(nodeId) {
        // Zoom logic remains similar but camera distance is now adjusted for nested volumes
        const node = this.nodes.find(n => n.id === nodeId) || (this.containerMesh && this.containerMesh.userData.node);
        if (!node) return;

        const radius = this.calculateRadius(node);
        const targetPos = new THREE.Vector3(0, 0, 0); // Always focus center for nested views
        const cameraDist = radius * 3.5;

        new TWEEN.Tween(this.camera.position)
            .to({ x: 0, y: 0, z: cameraDist }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        new TWEEN.Tween(this.controls.target)
            .to({ x: 0, y: 0, z: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }

    highlightRegimes(regimes, colorMap) {
        this.currentRegimes = regimes;

        // Update data state for mapping colors
        this.nodes.forEach(node => {
            if (node.type === 'mapping') {
                const hex = colorMap[node.regime] ? colorMap[node.regime].replace('#', '0x') : '0xffffff';
                node.regimeColor = parseInt(hex);
            }
        });

        // Update mesh visuals based on nodes
        this.nodes.forEach(node => {
            const mesh = this.nodeMeshes.get(node.id);
            if (!mesh) return;

            const isRegimeMatch = node.type === 'mapping' && this.currentRegimes.includes(node.regime);
            if (isRegimeMatch) {
                mesh.material.color.setHex(node.regimeColor);
                mesh.material.opacity = 1.0;
                mesh.material.emissiveIntensity = 0.6;
                mesh.material.emissive.setHex(node.regimeColor);
            } else {
                const isLeaf = !node.children || node.children.length === 0;
                mesh.material.color.setHex(node.type === 'domain' ? 0x3b82f6 : (node.type === 'pptdf' ? 0x60a5fa : 0xffffff));
                mesh.material.opacity = isLeaf ? 0.9 : 0.4;
                mesh.material.emissiveIntensity = 0;
            }
        });
    }

    clear() {
        if (this.simulation) this.simulation.stop();
        this.nodeMeshes.forEach(mesh => this.scene.remove(mesh));
        if (this.containerMesh) this.scene.remove(this.containerMesh);
        this.nodeMeshes.clear();
        this.nodeLabels.forEach(label => {
            if (label.parent) label.parent.remove(label);
        });
        this.nodeLabels.clear();
        this.nodes = [];
        this.links = [];
        this.containerMesh = null;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        TWEEN.update();

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const visibleMeshes = Array.from(this.nodeMeshes.values()).filter(m => m);
        const intersects = this.raycaster.intersectObjects(visibleMeshes);

        // Surface Billboarding: Labels stay on surface but face camera
        this.nodeLabels.forEach((label, mesh) => {
            // Calculate world position of the mesh
            const worldPos = new THREE.Vector3();
            mesh.getWorldPosition(worldPos);

            // Direction from mesh to camera
            const dir = new THREE.Vector3().subVectors(this.camera.position, worldPos).normalize();

            // Position the label on the surface in that direction
            const radius = mesh.userData.radius * (mesh.material.side === THREE.BackSide ? 1.02 : 1.05);
            label.position.copy(dir.multiplyScalar(radius));

            // Make the label face the camera
            label.lookAt(this.camera.position);
        });

        this.renderer.render(this.scene, this.camera);
    }
}
