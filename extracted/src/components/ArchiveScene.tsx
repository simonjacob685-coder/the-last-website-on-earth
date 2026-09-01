import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  MemoryId,
  DiscoveryId,
  MEMORIES_DATA,
  SECRET_SIGNAL_DATA,
  ENVIRONMENTAL_OBJECTS,
  ARCHIVAL_FRAGMENTS,
} from '../types';
import { soundEngine } from '../utils/audio';

interface ArchiveSceneProps {
  activeDiscovery: DiscoveryId | null;
  onSelectDiscovery: (id: DiscoveryId) => void;
  recoveredIds: MemoryId[];
  discoveredFragmentIds: string[];
  onDiscoverFragment: (fragmentId: string) => void;
  secretDiscovered: boolean;
  onSceneReady?: () => void;
}

export const ArchiveScene: React.FC<ArchiveSceneProps> = ({
  activeDiscovery,
  onSelectDiscovery,
  recoveredIds,
  discoveredFragmentIds,
  onDiscoverFragment,
  secretDiscovered,
  onSceneReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSceneInitialized = useRef<boolean>(false);
  const [webGlSupported, setWebGlSupported] = React.useState<boolean>(true);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Synced Props Refs for render loop & raycaster
  const activeDiscoveryRef = useRef<DiscoveryId | null>(activeDiscovery);
  activeDiscoveryRef.current = activeDiscovery;

  const recoveredIdsRef = useRef<MemoryId[]>(recoveredIds);
  recoveredIdsRef.current = recoveredIds;

  const discoveredFragmentIdsRef = useRef<string[]>(discoveredFragmentIds);
  discoveredFragmentIdsRef.current = discoveredFragmentIds;

  const secretDiscoveredRef = useRef<boolean>(secretDiscovered);
  secretDiscoveredRef.current = secretDiscovered;

  const onSelectDiscoveryRef = useRef(onSelectDiscovery);
  onSelectDiscoveryRef.current = onSelectDiscovery;

  const onDiscoverFragmentRef = useRef(onDiscoverFragment);
  onDiscoverFragmentRef.current = onDiscoverFragment;

  // Scene references for updates
  const secretGroupRef = useRef<THREE.Group | null>(null);
  const fragmentMeshesRef = useRef<
    { id: string; group: THREE.Group; shard: THREE.Mesh; ring: THREE.Mesh; shardMat: THREE.MeshStandardMaterial; ringMat: THREE.MeshBasicMaterial }[]
  >([]);
  const memoryAnchorsRef = useRef<{ [key in MemoryId]?: { updateStatus: (recovered: boolean) => void } }>({});
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const bgStarsMatRef = useRef<THREE.PointsMaterial | null>(null);

  // References to animate & control
  const animFrameId = useRef<number | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 10.2));
  const currentCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 10.2));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const camLerpSpeed = useRef<number>(0.065);

  // Lighting and Fog color targets for reactive mood transitions
  const targetFogColor = useRef<THREE.Color>(new THREE.Color(0x020408));
  const currentFogColor = useRef<THREE.Color>(new THREE.Color(0x020408));
  const targetAmbientColor = useRef<THREE.Color>(new THREE.Color(0x1e293b));
  const currentAmbientColor = useRef<THREE.Color>(new THREE.Color(0x1e293b));

  // Dynamic environmental illumination target based on progress
  const targetAmbientIntensity = useRef<number>(1.4);
  const currentAmbientIntensity = useRef<number>(1.4);
  const targetCoreIntensity = useRef<number>(3.6);
  const currentCoreIntensity = useRef<number>(3.6);

  // Orbit state
  const orbitAngle = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0.15,
    phi: Math.PI / 2 - 0.12,
    radius: 10.2,
  });
  const targetOrbitAngle = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0.15,
    phi: Math.PI / 2 - 0.12,
    radius: 10.2,
  });

  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartRadius = useRef<number>(10.2);

  // The World Watches Back: Reactive states
  const watchingBeaconIntensity = useRef<number>(0);
  const lastWatcherTriggerTime = useRef<number>(0);
  const glanceFlickerTime = useRef<number>(0);

  // Progress-based environment state
  const recoveredCount = recoveredIds.length;
  const allRecovered = recoveredCount === 3;

  // Handle active discovery camera transitions & reactive atmospheric shifts
  useEffect(() => {
    if (activeDiscovery) {
      if (activeDiscovery === 'ocean') {
        const data = MEMORIES_DATA.ocean;
        targetCamPos.current.set(...data.cameraPosition);
        targetCamLook.current.set(...data.cameraTarget);
        camLerpSpeed.current = 0.042;
        targetFogColor.current.setHex(0x010d18);
        targetAmbientColor.current.setHex(0x0c334d);
        soundEngine.playMemoryOpen('ocean');
      } else if (activeDiscovery === 'city') {
        const data = MEMORIES_DATA.city;
        targetCamPos.current.set(...data.cameraPosition);
        targetCamLook.current.set(...data.cameraTarget);
        camLerpSpeed.current = 0.048;
        targetFogColor.current.setHex(0x120a02);
        targetAmbientColor.current.setHex(0x3d2608);
        soundEngine.playMemoryOpen('city');
      } else if (activeDiscovery === 'message') {
        const data = MEMORIES_DATA.message;
        targetCamPos.current.set(...data.cameraPosition);
        targetCamLook.current.set(...data.cameraTarget);
        camLerpSpeed.current = 0.026;
        targetFogColor.current.setHex(0x01120b);
        targetAmbientColor.current.setHex(0x092b1e);
        soundEngine.playMemoryOpen('message');
      } else if (activeDiscovery === 'archive_core') {
        targetCamPos.current.set(0, 0.8, 5.6);
        targetCamLook.current.set(0, 0, 0);
        camLerpSpeed.current = 0.05;
        targetFogColor.current.setHex(0x031020);
        targetAmbientColor.current.setHex(0x0d3c61);
        soundEngine.setFocusAtmosphere('archive_core');
      } else if (activeDiscovery === 'secret_signal') {
        targetCamPos.current.set(...SECRET_SIGNAL_DATA.cameraPosition);
        targetCamLook.current.set(...SECRET_SIGNAL_DATA.cameraTarget);
        camLerpSpeed.current = 0.032;
        targetFogColor.current.setHex(0x080414);
        targetAmbientColor.current.setHex(0x28194a);
        soundEngine.setFocusAtmosphere('secret_signal');
      } else if (activeDiscovery === 'terminal') {
        const data = ENVIRONMENTAL_OBJECTS.terminal;
        targetCamPos.current.set(...data.cameraPosition);
        targetCamLook.current.set(...data.cameraTarget);
        camLerpSpeed.current = 0.045;
        targetFogColor.current.setHex(0x02070e);
        targetAmbientColor.current.setHex(0x102438);
        soundEngine.playObjectInspect();
      } else if (activeDiscovery === 'transceiver') {
        const data = ENVIRONMENTAL_OBJECTS.transceiver;
        targetCamPos.current.set(...data.cameraPosition);
        targetCamLook.current.set(...data.cameraTarget);
        camLerpSpeed.current = 0.045;
        targetFogColor.current.setHex(0x090505);
        targetAmbientColor.current.setHex(0x2d1717);
        soundEngine.playObjectInspect();
      }
    } else {
      // Return to overview orbit position & progress-calibrated atmosphere
      camLerpSpeed.current = 0.055;
      soundEngine.setFocusAtmosphere(null);

      if (recoveredCount === 0) {
        targetFogColor.current.setHex(0x020306);
        targetAmbientColor.current.setHex(0x16202f);
        targetAmbientIntensity.current = 1.3;
        targetCoreIntensity.current = 3.2;
      } else if (recoveredCount === 1) {
        targetFogColor.current.setHex(0x020409);
        targetAmbientColor.current.setHex(0x1b273b);
        targetAmbientIntensity.current = 1.5;
        targetCoreIntensity.current = 3.8;
      } else if (recoveredCount === 2) {
        targetFogColor.current.setHex(0x02050d);
        targetAmbientColor.current.setHex(0x20304a);
        targetAmbientIntensity.current = 1.75;
        targetCoreIntensity.current = 4.4;
      } else {
        // 3 memories recovered (Full archive online)
        targetFogColor.current.setHex(0x030814);
        targetAmbientColor.current.setHex(0x243b59);
        targetAmbientIntensity.current = 2.1;
        targetCoreIntensity.current = 5.2;
      }

      const sinPhi = Math.sin(targetOrbitAngle.current.phi);
      const cosPhi = Math.cos(targetOrbitAngle.current.phi);
      const sinTheta = Math.sin(targetOrbitAngle.current.theta);
      const cosTheta = Math.cos(targetOrbitAngle.current.theta);
      const r = targetOrbitAngle.current.radius;

      targetCamPos.current.set(
        r * sinPhi * sinTheta,
        r * cosPhi + 0.8,
        r * sinPhi * cosTheta
      );
      targetCamLook.current.set(0, 0, 0);
    }
  }, [activeDiscovery, recoveredCount]);

  // Update in-scene elements whenever recoveredIds or discoveredFragmentIds change
  useEffect(() => {
    // 1. Update secret signal beacon visibility
    if (secretGroupRef.current) {
      secretGroupRef.current.visible = allRecovered;
    }

    // 2. Update memory anchor visuals
    (['ocean', 'city', 'message'] as MemoryId[]).forEach((id) => {
      const isRecovered = recoveredIds.includes(id);
      memoryAnchorsRef.current[id]?.updateStatus(isRecovered);
    });

    // 3. Update grid helper opacity
    if (gridHelperRef.current && gridHelperRef.current.material instanceof THREE.Material) {
      gridHelperRef.current.material.opacity = 0.14 + recoveredCount * 0.05;
    }

    // 4. Update background stars opacity
    if (bgStarsMatRef.current) {
      bgStarsMatRef.current.opacity = 0.35 + recoveredCount * 0.08;
    }

    // 5. Update fragment meshes
    fragmentMeshesRef.current.forEach((fm) => {
      const isDiscovered = discoveredFragmentIds.includes(fm.id);
      fm.shardMat.color.setHex(isDiscovered ? 0x059669 : 0x0284c7);
      fm.shardMat.emissive.setHex(isDiscovered ? 0x10b981 : 0x00f0ff);
      fm.shardMat.emissiveIntensity = isDiscovered ? 0.35 : 0.8;
      fm.shardMat.opacity = isDiscovered ? 0.45 : 0.85;
      fm.ringMat.color.setHex(isDiscovered ? 0x10b981 : 0x38bdf8);
      fm.ringMat.opacity = isDiscovered ? 0.25 : 0.6;
    });
  }, [recoveredIds, discoveredFragmentIds, allRecovered, recoveredCount]);

  // Initialize Three.js scene ONCE
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || isSceneInitialized.current) return;

    // Check for WebGL capability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        setIsLoading(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      setIsLoading(false);
      return;
    }

    isSceneInitialized.current = true;

    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    const isMobile = width < 768;

    // Adjust camera distance and FOV for mobile
    const baseRadius = isMobile ? 11.2 : 9.8;
    orbitAngle.current.radius = baseRadius;
    targetOrbitAngle.current.radius = baseRadius;
    targetCamPos.current.set(
      baseRadius * Math.sin(orbitAngle.current.phi) * Math.sin(orbitAngle.current.theta),
      baseRadius * Math.cos(orbitAngle.current.phi) + 0.8,
      baseRadius * Math.sin(orbitAngle.current.phi) * Math.cos(orbitAngle.current.theta)
    );
    currentCamPos.current.copy(targetCamPos.current);

    // Scene
    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x020408, 0.03);
    scene.fog = fog;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 52 : 46,
      width / height,
      0.1,
      120
    );
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentCamLook.current);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        alpha: false,
      });
      renderer.setClearColor(0x020306, 1);
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
    } catch (e) {
      console.warn("Failed to initialize WebGLRenderer:", e);
      setWebGlSupported(false);
      setIsLoading(false);
      return;
    }

    // ----------------------------------------------------
    // LIGHTING SETUP
    // ----------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0x1e293b, targetAmbientIntensity.current);
    scene.add(ambientLight);

    const corePointLight = new THREE.PointLight(0x00f0ff, targetCoreIntensity.current, 24, 1.2);
    corePointLight.position.set(0, 0.5, 0);
    scene.add(corePointLight);

    const deepBlueLight = new THREE.PointLight(0x0284c7, 2.5, 18, 1.4);
    deepBlueLight.position.set(0, -1.0, 0);
    scene.add(deepBlueLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const oceanLight = new THREE.PointLight(0x00e5ff, 2.8, 8, 1.5);
    oceanLight.position.set(-4.2, 1.2, 2.2);
    scene.add(oceanLight);

    const cityLight = new THREE.PointLight(0xffb300, 3.2, 8, 1.5);
    cityLight.position.set(4.4, 1.8, 1.6);
    scene.add(cityLight);

    const messageLight = new THREE.PointLight(0x10b981, 2.8, 8, 1.5);
    messageLight.position.set(0.2, -2.6, 3.4);
    scene.add(messageLight);

    const watcherLight = new THREE.PointLight(0x38bdf8, 0.0, 35, 1.8);
    watcherLight.position.set(-14.0, 4.5, -16.0);
    scene.add(watcherLight);

    // ----------------------------------------------------
    // 1. CENTRAL ARCHIVE STRUCTURE (Interactive Core)
    // ----------------------------------------------------
    const centralArchiveGroup = new THREE.Group();
    scene.add(centralArchiveGroup);

    const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x031d38,
      emissive: 0x005b8a,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.65,
      ior: 1.5,
      thickness: 1.2,
      transparent: true,
      opacity: 0.92,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    centralArchiveGroup.add(coreMesh);

    const coreWireGeo = new THREE.IcosahedronGeometry(1.62, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
    centralArchiveGroup.add(coreWireMesh);

    const innerCoreGeo = new THREE.SphereGeometry(0.85, 24, 24);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    centralArchiveGroup.add(innerCoreMesh);

    // Central Archive Label Anchor
    const coreAnchorCanvas = document.createElement('canvas');
    coreAnchorCanvas.width = 256;
    coreAnchorCanvas.height = 70;
    const coreCtx = coreAnchorCanvas.getContext('2d');
    if (coreCtx) {
      coreCtx.fillStyle = 'rgba(2, 6, 14, 0.85)';
      coreCtx.fillRect(6, 6, 244, 58);
      coreCtx.strokeStyle = '#00f0ff';
      coreCtx.lineWidth = 1.5;
      coreCtx.strokeRect(6, 6, 244, 58);
      coreCtx.font = 'bold 18px "JetBrains Mono", monospace';
      coreCtx.fillStyle = '#00f0ff';
      coreCtx.textAlign = 'center';
      coreCtx.fillText('ARCHIVE NODE 01', 128, 42);
    }
    const coreLabelTexture = new THREE.CanvasTexture(coreAnchorCanvas);
    const coreLabelGeo = new THREE.PlaneGeometry(1.5, 0.42);
    const coreLabelMat = new THREE.MeshBasicMaterial({
      map: coreLabelTexture,
      transparent: true,
      opacity: 0.8,
    });
    const coreLabelMesh = new THREE.Mesh(coreLabelGeo, coreLabelMat);
    coreLabelMesh.position.y = -2.1;
    centralArchiveGroup.add(coreLabelMesh);

    // Orbital Rings
    const ring1Geo = new THREE.TorusGeometry(3.0, 0.035, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    centralArchiveGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.6, 0.025, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 3;
    centralArchiveGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(4.2, 0.02, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0099b8,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.9,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 2.5;
    ring3.rotation.z = -Math.PI / 5;
    centralArchiveGroup.add(ring3);

    const dashedRingGeo = new THREE.RingGeometry(3.8, 3.84, 64);
    const dashedRingMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
    });
    const dashedRing = new THREE.Mesh(dashedRingGeo, dashedRingMat);
    dashedRing.rotation.x = Math.PI / 2;
    centralArchiveGroup.add(dashedRing);

    // Data Shards
    const shardCount = isMobile ? 36 : 64;
    const shardsGroup = new THREE.Group();
    const shardGeo = new THREE.TetrahedronGeometry(0.12, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x007799,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.9,
    });

    const shardData: {
      mesh: THREE.Mesh;
      angle: number;
      radius: number;
      speed: number;
      yOffset: number;
      rotSpeed: THREE.Vector3;
    }[] = [];

    for (let i = 0; i < shardCount; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const radius = 2.2 + Math.random() * 2.4;
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const yOffset = (Math.random() - 0.5) * 2.2;
      shard.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
      shard.scale.setScalar(0.6 + Math.random() * 0.9);
      shardsGroup.add(shard);

      shardData.push({
        mesh: shard,
        angle,
        radius,
        speed: (0.15 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1) * 0.01,
        yOffset,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03,
          (Math.random() - 0.5) * 0.03
        ),
      });
    }
    centralArchiveGroup.add(shardsGroup);

    // Vertical Energy Axis Beam
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 14, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    centralArchiveGroup.add(beamMesh);

    // ----------------------------------------------------
    // 2. RECOVERABLE MEMORY OBJECTS
    // ----------------------------------------------------
    const createMemoryAnchor = (
      colorHex: number,
      labelText: string,
      initialRecovered: boolean,
      memoryId: MemoryId
    ) => {
      const group = new THREE.Group();

      const reticleGeo = new THREE.RingGeometry(0.9, 0.96, 32);
      const reticleMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: initialRecovered ? 0.9 : 0.65,
      });
      const reticle = new THREE.Mesh(reticleGeo, reticleMat);
      group.add(reticle);

      const outerRingGeo = new THREE.RingGeometry(1.08, 1.12, 4);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.rotation.z = Math.PI / 4;
      group.add(outerRing);

      const recoveredHaloGeo = new THREE.RingGeometry(1.22, 1.25, 32);
      const recoveredHaloMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: initialRecovered ? 0.75 : 0.0,
      });
      const halo = new THREE.Mesh(recoveredHaloGeo, recoveredHaloMat);
      halo.visible = initialRecovered;
      group.add(halo);

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');

      const renderLabel = (isRec: boolean) => {
        if (!ctx) return;
        ctx.clearRect(0, 0, 256, 80);
        ctx.fillStyle = 'rgba(2, 6, 12, 0.85)';
        ctx.fillRect(8, 8, 240, 64);
        ctx.strokeStyle = isRec ? '#10b981' : `#${colorHex.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, 240, 64);

        ctx.font = 'bold 18px "JetBrains Mono", monospace';
        ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
        ctx.textAlign = 'center';
        ctx.fillText(labelText, 128, 40);

        if (isRec) {
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.fillStyle = '#10b981';
          ctx.fillText('● RECOVERED // LOG ARCHIVED', 128, 60);
        }
      };

      renderLabel(initialRecovered);

      const labelTexture = new THREE.CanvasTexture(canvas);
      const labelGeo = new THREE.PlaneGeometry(1.6, 0.5);
      const labelMat = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        opacity: 0.92,
      });
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = -1.25;
      group.add(labelMesh);

      memoryAnchorsRef.current[memoryId] = {
        updateStatus: (rec: boolean) => {
          halo.visible = rec;
          recoveredHaloMat.opacity = rec ? 0.75 : 0.0;
          renderLabel(rec);
          labelTexture.needsUpdate = true;
        },
      };

      return group;
    };

    // MEMORY 01 — THE OCEAN
    const oceanGroup = new THREE.Group();
    oceanGroup.position.set(...MEMORIES_DATA.ocean.position);
    scene.add(oceanGroup);

    const oceanGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x002b4d,
      emissive: 0x0088cc,
      emissiveIntensity: 0.6,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.333,
      transparent: true,
      opacity: 0.9,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanGroup.add(oceanMesh);

    const waveGeo = new THREE.SphereGeometry(0.76, 24, 24);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    oceanGroup.add(waveMesh);

    const oceanRippleGeo = new THREE.RingGeometry(0.85, 0.88, 32);
    const oceanRippleMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const oceanRippleMesh = new THREE.Mesh(oceanRippleGeo, oceanRippleMat);
    oceanRippleMesh.rotation.x = Math.PI / 2;
    oceanGroup.add(oceanRippleMesh);

    const oceanRingGeo = new THREE.TorusGeometry(1.1, 0.018, 16, 64);
    const oceanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.6,
    });
    const oceanRing = new THREE.Mesh(oceanRingGeo, oceanRingMat);
    oceanRing.rotation.x = Math.PI / 3;
    oceanGroup.add(oceanRing);

    const oceanParticlesGeo = new THREE.BufferGeometry();
    const oceanParticleCount = 28;
    const oceanParticlePos = new Float32Array(oceanParticleCount * 3);
    for (let i = 0; i < oceanParticleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 0.85 + Math.random() * 0.45;
      oceanParticlePos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      oceanParticlePos[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      oceanParticlePos[i * 3 + 2] = rad * Math.cos(phi);
    }
    oceanParticlesGeo.setAttribute('position', new THREE.BufferAttribute(oceanParticlePos, 3));
    const oceanParticlesMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const oceanParticles = new THREE.Points(oceanParticlesGeo, oceanParticlesMat);
    oceanGroup.add(oceanParticles);

    const oceanAnchor = createMemoryAnchor(
      0x00f0ff,
      '01: THE OCEAN',
      recoveredIdsRef.current.includes('ocean'),
      'ocean'
    );
    oceanGroup.add(oceanAnchor);

    // MEMORY 02 — THE CITY
    const cityGroup = new THREE.Group();
    cityGroup.position.set(...MEMORIES_DATA.city.position);
    scene.add(cityGroup);

    const cityBaseGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.1, 24);
    const cityBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1204,
      emissive: 0x3d2600,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.8,
    });
    const cityBase = new THREE.Mesh(cityBaseGeo, cityBaseMat);
    cityBase.position.y = -0.4;
    cityGroup.add(cityBase);

    const buildingsGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x241805,
      emissive: 0xffb300,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.7,
    });
    const windowWireMat = new THREE.MeshBasicMaterial({
      color: 0xffb300,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });

    const buildingCoords = [
      { x: 0, z: 0, w: 0.22, h: 0.9, d: 0.22 },
      { x: 0.25, z: 0.15, w: 0.18, h: 0.7, d: 0.18 },
      { x: -0.22, z: 0.2, w: 0.16, h: 0.65, d: 0.16 },
      { x: 0.18, z: -0.25, w: 0.15, h: 0.55, d: 0.15 },
      { x: -0.28, z: -0.18, w: 0.18, h: 0.8, d: 0.18 },
      { x: 0.35, z: -0.1, w: 0.14, h: 0.45, d: 0.14 },
      { x: -0.1, z: 0.38, w: 0.15, h: 0.5, d: 0.15 },
      { x: -0.38, z: 0.05, w: 0.12, h: 0.4, d: 0.12 },
    ];

    buildingCoords.forEach((b) => {
      const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(b.x, -0.35 + b.h / 2, b.z);
      buildingsGroup.add(bMesh);

      const bWire = new THREE.Mesh(bGeo, windowWireMat);
      bWire.position.copy(bMesh.position);
      buildingsGroup.add(bWire);
    });
    cityGroup.add(buildingsGroup);

    const beaconGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.58, 0);
    cityGroup.add(beacon);

    const cityRingGeo = new THREE.TorusGeometry(1.15, 0.016, 16, 64);
    const cityRingMat = new THREE.MeshBasicMaterial({
      color: 0xffb300,
      transparent: true,
      opacity: 0.55,
    });
    const cityRing = new THREE.Mesh(cityRingGeo, cityRingMat);
    cityRing.rotation.x = Math.PI / 2.5;
    cityRing.rotation.y = Math.PI / 5;
    cityGroup.add(cityRing);

    const cityAnchor = createMemoryAnchor(
      0xffb300,
      '02: THE CITY',
      recoveredIdsRef.current.includes('city'),
      'city'
    );
    cityGroup.add(cityAnchor);

    // MEMORY 03 — THE MESSAGE
    const messageGroup = new THREE.Group();
    messageGroup.position.set(...MEMORIES_DATA.message.position);
    scene.add(messageGroup);

    const msgCoreGeo = new THREE.OctahedronGeometry(0.7, 0);
    const msgCoreMat = new THREE.MeshStandardMaterial({
      color: 0x022c22,
      emissive: 0x10b981,
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.85,
    });
    const msgCore = new THREE.Mesh(msgCoreGeo, msgCoreMat);
    messageGroup.add(msgCore);

    const msgWireGeo = new THREE.OctahedronGeometry(0.74, 1);
    const msgWireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const msgWire = new THREE.Mesh(msgWireGeo, msgWireMat);
    messageGroup.add(msgWire);

    const msgRingGeo = new THREE.RingGeometry(0.95, 1.0, 32);
    const msgRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const msgRing1 = new THREE.Mesh(msgRingGeo, msgRingMat);
    msgRing1.rotation.x = Math.PI / 4;
    messageGroup.add(msgRing1);

    const msgRing2 = new THREE.RingGeometry(0.95, 1.0, 32);
    const msgRing2Mat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const msgRing2Mesh = new THREE.Mesh(msgRing2, msgRing2Mat);
    msgRing2Mesh.rotation.y = Math.PI / 3;
    messageGroup.add(msgRing2Mesh);

    const messageAnchor = createMemoryAnchor(
      0x10b981,
      '03: THE MESSAGE',
      recoveredIdsRef.current.includes('message'),
      'message'
    );
    messageGroup.add(messageAnchor);

    // ----------------------------------------------------
    // ENVIRONMENTAL STORYTELLING OBJECTS
    // ----------------------------------------------------
    const createObjectLabel = (code: string, name: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 70;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(4, 8, 16, 0.9)';
        ctx.fillRect(4, 4, 248, 62);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(4, 4, 248, 62);
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(`${code} // ${name}`, 128, 40);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const geo = new THREE.PlaneGeometry(1.2, 0.32);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85 });
      return new THREE.Mesh(geo, mat);
    };

    // Abandoned Terminal
    const terminalGroup = new THREE.Group();
    terminalGroup.position.set(...ENVIRONMENTAL_OBJECTS.terminal.position);
    scene.add(terminalGroup);

    const termStandGeo = new THREE.BoxGeometry(0.5, 0.8, 0.4);
    const termStandMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.7,
    });
    const termStand = new THREE.Mesh(termStandGeo, termStandMat);
    termStand.position.y = 0.4;
    terminalGroup.add(termStand);

    const termScreenGeo = new THREE.BoxGeometry(0.46, 0.36, 0.32);
    const termScreenMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.4,
      metalness: 0.8,
    });
    const termScreen = new THREE.Mesh(termScreenGeo, termScreenMat);
    termScreen.position.set(0, 0.95, 0);
    termScreen.rotation.x = -0.15;
    terminalGroup.add(termScreen);

    const crtGlassGeo = new THREE.PlaneGeometry(0.38, 0.28);
    const crtGlassMat = new THREE.MeshBasicMaterial({
      color: 0x021526,
      transparent: true,
      opacity: 0.9,
    });
    const crtGlass = new THREE.Mesh(crtGlassGeo, crtGlassMat);
    crtGlass.position.set(0, 0.95, 0.165);
    crtGlass.rotation.x = -0.15;
    terminalGroup.add(crtGlass);

    const crtCursorGeo = new THREE.PlaneGeometry(0.08, 0.015);
    const crtCursorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });
    const crtCursor = new THREE.Mesh(crtCursorGeo, crtCursorMat);
    crtCursor.position.set(-0.08, 0.95, 0.168);
    crtCursor.rotation.x = -0.15;
    terminalGroup.add(crtCursor);

    const termLabel = createObjectLabel('OBJECT 07', 'TERMINAL');
    termLabel.position.y = 1.35;
    terminalGroup.add(termLabel);

    // Old Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(-2.8, -4.1, 1.3);
    chairGroup.rotation.y = 0.35;
    scene.add(chairGroup);

    const chairBaseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.08, 12);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.6 });
    const chairBase = new THREE.Mesh(chairBaseGeo, chairMat);
    chairGroup.add(chairBase);

    const chairStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8);
    const chairStem = new THREE.Mesh(chairStemGeo, chairMat);
    chairStem.position.y = 0.25;
    chairGroup.add(chairStem);

    const chairSeatGeo = new THREE.BoxGeometry(0.38, 0.06, 0.36);
    const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
    chairSeat.position.set(0, 0.48, 0);
    chairGroup.add(chairSeat);

    const chairBackGeo = new THREE.BoxGeometry(0.36, 0.35, 0.04);
    const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
    chairBack.position.set(0, 0.7, -0.16);
    chairBack.rotation.x = -0.1;
    chairGroup.add(chairBack);

    // Floor Cables
    const cablesGroup = new THREE.Group();
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x09121d });

    const cablePoints1 = [
      new THREE.Vector3(-2.8, -4.48, 0.6),
      new THREE.Vector3(-2.2, -4.48, 0.8),
      new THREE.Vector3(-1.4, -4.48, 0.4),
      new THREE.Vector3(-0.4, -4.48, 0.1),
    ];
    const cableCurve1 = new THREE.CatmullRomCurve3(cablePoints1);
    const cableGeo1 = new THREE.TubeGeometry(cableCurve1, 24, 0.03, 8, false);
    const cableMesh1 = new THREE.Mesh(cableGeo1, cableMat);
    cablesGroup.add(cableMesh1);

    const cablePoints2 = [
      new THREE.Vector3(3.4, -4.48, 2.8),
      new THREE.Vector3(2.6, -4.48, 2.2),
      new THREE.Vector3(1.6, -4.48, 1.2),
      new THREE.Vector3(0.5, -4.48, 0.2),
    ];
    const cableCurve2 = new THREE.CatmullRomCurve3(cablePoints2);
    const cableGeo2 = new THREE.TubeGeometry(cableCurve2, 24, 0.025, 8, false);
    const cableMesh2 = new THREE.Mesh(cableGeo2, cableMat);
    cablesGroup.add(cableMesh2);
    scene.add(cablesGroup);

    // Transceiver
    const transGroup = new THREE.Group();
    transGroup.position.set(...ENVIRONMENTAL_OBJECTS.transceiver.position);
    scene.add(transGroup);

    const transBoxGeo = new THREE.BoxGeometry(0.48, 0.32, 0.38);
    const transBoxMat = new THREE.MeshStandardMaterial({
      color: 0x1f1616,
      roughness: 0.5,
      metalness: 0.75,
    });
    const transBox = new THREE.Mesh(transBoxGeo, transBoxMat);
    transBox.position.y = 0.2;
    transGroup.add(transBox);

    const antennaStemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.4, 8);
    const antennaStem = new THREE.Mesh(antennaStemGeo, transBoxMat);
    antennaStem.position.set(0.14, 0.48, 0.08);
    antennaStem.rotation.z = -0.35;
    transGroup.add(antennaStem);

    const diodeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const diodeMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    const diode = new THREE.Mesh(diodeGeo, diodeMat);
    diode.position.set(-0.14, 0.28, 0.195);
    transGroup.add(diode);

    const transLabel = createObjectLabel('OBJECT 12', 'TRANSCEIVER');
    transLabel.position.y = 0.68;
    transGroup.add(transLabel);

    // Distant Monoliths
    const distantRuinsGroup = new THREE.Group();
    const ruinMat = new THREE.MeshStandardMaterial({
      color: 0x060c14,
      emissive: 0x0284c7,
      emissiveIntensity: 0.12,
      roughness: 0.8,
      metalness: 0.4,
    });

    const ruinPillars = [
      { x: -14.0, y: 1.5, z: -16.0, w: 0.8, h: 6.0, d: 0.8, rotZ: 0.05 },
      { x: -12.4, y: 0.8, z: -16.0, w: 0.7, h: 4.2, d: 0.7, rotZ: -0.08 },
      { x: 15.0, y: 2.0, z: -18.0, w: 0.9, h: 7.5, d: 0.9, rotZ: -0.04 },
      { x: -16.0, y: 1.8, z: 12.0, w: 0.8, h: 5.8, d: 0.8, rotZ: 0.06 },
      { x: 17.0, y: 1.2, z: 10.0, w: 0.75, h: 4.8, d: 0.75, rotZ: -0.05 },
    ];

    ruinPillars.forEach((rp) => {
      const rGeo = new THREE.BoxGeometry(rp.w, rp.h, rp.d);
      const rMesh = new THREE.Mesh(rGeo, ruinMat);
      rMesh.position.set(rp.x, rp.y, rp.z);
      rMesh.rotation.z = rp.rotZ;
      distantRuinsGroup.add(rMesh);
    });
    scene.add(distantRuinsGroup);

    const distantLightGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const distantLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const distantLightMesh = new THREE.Mesh(distantLightGeo, distantLightMat);
    distantLightMesh.position.set(-14.0, 4.6, -16.0);
    scene.add(distantLightMesh);

    // ----------------------------------------------------
    // HIDDEN ARCHIVAL FRAGMENTS (5 Subtle Shards)
    // ----------------------------------------------------
    fragmentMeshesRef.current = [];
    const fragGeo = new THREE.OctahedronGeometry(0.16, 0);

    ARCHIVAL_FRAGMENTS.forEach((frag) => {
      const isDiscovered = discoveredFragmentIdsRef.current.includes(frag.id);
      const fragGroup = new THREE.Group();
      fragGroup.position.set(...frag.position);

      const shardMat = new THREE.MeshStandardMaterial({
        color: isDiscovered ? 0x059669 : 0x0284c7,
        emissive: isDiscovered ? 0x10b981 : 0x00f0ff,
        emissiveIntensity: isDiscovered ? 0.35 : 0.8,
        roughness: 0.2,
        metalness: 0.85,
        transparent: true,
        opacity: isDiscovered ? 0.45 : 0.85,
      });
      const shardMesh = new THREE.Mesh(fragGeo, shardMat);
      fragGroup.add(shardMesh);

      const microRingGeo = new THREE.RingGeometry(0.24, 0.26, 16);
      const microRingMat = new THREE.MeshBasicMaterial({
        color: isDiscovered ? 0x10b981 : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDiscovered ? 0.25 : 0.6,
      });
      const microRing = new THREE.Mesh(microRingGeo, microRingMat);
      microRing.rotation.x = Math.PI / 2;
      fragGroup.add(microRing);

      scene.add(fragGroup);
      fragmentMeshesRef.current.push({
        id: frag.id,
        group: fragGroup,
        shard: shardMesh,
        ring: microRing,
        shardMat,
        ringMat: microRingMat,
      });
    });

    // ----------------------------------------------------
    // SECRET FOURTH DISCOVERY (Final Signal Beacon)
    // ----------------------------------------------------
    const secretGroup = new THREE.Group();
    secretGroup.position.set(...SECRET_SIGNAL_DATA.position);
    scene.add(secretGroup);
    secretGroup.visible = recoveredIdsRef.current.length === 3;
    secretGroupRef.current = secretGroup;

    const secretCoreGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const secretCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const secretCore = new THREE.Mesh(secretCoreGeo, secretCoreMat);
    secretGroup.add(secretCore);

    const secretRingGeo = new THREE.RingGeometry(0.55, 0.6, 32);
    const secretRingMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const secretRing = new THREE.Mesh(secretRingGeo, secretRingMat);
    secretGroup.add(secretRing);

    const secretBeamGeo = new THREE.CylinderGeometry(0.015, 0.04, 10, 8);
    const secretBeamMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.4,
    });
    const secretBeam = new THREE.Mesh(secretBeamGeo, secretBeamMat);
    secretBeam.position.y = 5;
    secretGroup.add(secretBeam);

    const secretCanvas = document.createElement('canvas');
    secretCanvas.width = 256;
    secretCanvas.height = 70;
    const secretCtx = secretCanvas.getContext('2d');
    if (secretCtx) {
      secretCtx.fillStyle = 'rgba(10, 5, 20, 0.85)';
      secretCtx.fillRect(6, 6, 244, 58);
      secretCtx.strokeStyle = '#c084fc';
      secretCtx.lineWidth = 1.5;
      secretCtx.strokeRect(6, 6, 244, 58);
      secretCtx.font = 'bold 16px "JetBrains Mono", monospace';
      secretCtx.fillStyle = '#e9d5ff';
      secretCtx.textAlign = 'center';
      secretCtx.fillText('● UNKNOWN SIGNAL', 128, 42);
    }
    const secretLabelTex = new THREE.CanvasTexture(secretCanvas);
    const secretLabelGeo = new THREE.PlaneGeometry(1.4, 0.38);
    const secretLabelMat = new THREE.MeshBasicMaterial({
      map: secretLabelTex,
      transparent: true,
      opacity: 0.85,
    });
    const secretLabelMesh = new THREE.Mesh(secretLabelGeo, secretLabelMat);
    secretLabelMesh.position.y = -0.9;
    secretGroup.add(secretLabelMesh);

    // ----------------------------------------------------
    // GROUND / ENVIRONMENT
    // ----------------------------------------------------
    const gridHelper = new THREE.GridHelper(44, 44, 0x00f0ff, 0x0a192f);
    gridHelper.position.y = -4.5;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.14 + recoveredIdsRef.current.length * 0.05;
    }
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const floorGeo = new THREE.CircleGeometry(24, 32);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x01050a,
      transparent: true,
      opacity: 0.85,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -4.52;
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 14, 8);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.08,
    });
    const pillarPositions = [
      [-12, 1, -10],
      [12, 1, -10],
      [-14, 1, 4],
      [14, 1, 4],
      [0, 1, -14],
    ];
    pillarPositions.forEach(([x, y, z]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, y, z);
      scene.add(p);
    });

    // Stars / Particles
    const bgStarsGeo = new THREE.BufferGeometry();
    const bgStarsCount = isMobile ? 140 : 280;
    const bgStarsPositions = new Float32Array(bgStarsCount * 3);
    for (let i = 0; i < bgStarsCount; i++) {
      bgStarsPositions[i * 3] = (Math.random() - 0.5) * 60;
      bgStarsPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      bgStarsPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    bgStarsGeo.setAttribute('position', new THREE.BufferAttribute(bgStarsPositions, 3));
    const bgStarsMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.08,
      transparent: true,
      opacity: 0.35 + recoveredIdsRef.current.length * 0.08,
    });
    const bgStars = new THREE.Points(bgStarsGeo, bgStarsMat);
    scene.add(bgStars);
    bgStarsMatRef.current = bgStarsMat;

    setIsLoading(false);
    if (onSceneReady) onSceneReady();

    // ----------------------------------------------------
    // ANIMATION RENDER LOOP
    // ----------------------------------------------------
    let lastTime = performance.now();
    let oceanRippleScale = 1.0;

    const animate = (time: number) => {
      animFrameId.current = requestAnimationFrame(animate);
      try {
        const delta = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

      const currentActiveDiscovery = activeDiscoveryRef.current;
      const isAllRecovered = recoveredIdsRef.current.length === 3;

      // Smooth atmospheric fog & ambient color shift
      currentFogColor.current.lerp(targetFogColor.current, 0.04);
      fog.color.copy(currentFogColor.current);
      renderer.setClearColor(currentFogColor.current, 1);

      currentAmbientColor.current.lerp(targetAmbientColor.current, 0.04);
      ambientLight.color.copy(currentAmbientColor.current);

      currentAmbientIntensity.current += (targetAmbientIntensity.current - currentAmbientIntensity.current) * 0.04;
      ambientLight.intensity = currentAmbientIntensity.current;

      currentCoreIntensity.current += (targetCoreIntensity.current - currentCoreIntensity.current) * 0.04;

      const movementDamping = currentActiveDiscovery === 'message' ? 0.3 : 1.0;

      // Central structure rotation
      coreMesh.rotation.y += 0.003 * movementDamping;
      coreMesh.rotation.x += 0.0015 * movementDamping;
      coreWireMesh.rotation.y += 0.003 * movementDamping;
      coreWireMesh.rotation.x += 0.0015 * movementDamping;

      const currentRadius = targetOrbitAngle.current.radius;
      const isFarOrbit = currentRadius > 12.0;
      const pulseSpeed = isFarOrbit ? 0.0012 : 0.002;
      const pulse = Math.sin(time * pulseSpeed) * 0.08 + 0.85;
      innerCoreMesh.scale.setScalar(pulse);
      corePointLight.intensity = currentCoreIntensity.current + Math.sin(time * 0.0025) * 0.5;

      // Rings orbital rotations
      ring1.rotation.z += 0.0025 * movementDamping;
      ring2.rotation.y += 0.0035 * movementDamping;
      ring3.rotation.x += 0.002 * movementDamping;
      dashedRing.rotation.z -= 0.0015 * movementDamping;

      // Shards orbit
      shardData.forEach((sd) => {
        sd.angle += sd.speed * movementDamping;
        sd.mesh.position.x = Math.cos(sd.angle) * sd.radius;
        sd.mesh.position.z = Math.sin(sd.angle) * sd.radius;
        sd.mesh.position.y = sd.yOffset + Math.sin(time * 0.0015 + sd.angle) * 0.15;
        sd.mesh.rotation.x += sd.rotSpeed.x;
        sd.mesh.rotation.y += sd.rotSpeed.y;
        sd.mesh.rotation.z += sd.rotSpeed.z;
      });

      // Memory 01 (Ocean)
      oceanMesh.rotation.y += 0.006;
      waveMesh.rotation.y -= 0.004;
      oceanRing.rotation.z += 0.005;
      oceanParticles.rotation.y += 0.004;
      oceanGroup.position.y = MEMORIES_DATA.ocean.position[1] + Math.sin(time * 0.0015) * 0.08;

      oceanRippleScale += delta * 0.6;
      if (oceanRippleScale > 2.2) oceanRippleScale = 1.0;
      oceanRippleMesh.scale.setScalar(oceanRippleScale);
      oceanRippleMat.opacity = Math.max(0, 0.7 * (1 - (oceanRippleScale - 1.0) / 1.2));

      // Memory 02 (City)
      cityGroup.rotation.y += 0.003;
      cityRing.rotation.z -= 0.004;
      cityGroup.position.y = MEMORIES_DATA.city.position[1] + Math.sin(time * 0.0018 + 1.5) * 0.08;
      const isBlink = Math.floor(time * 0.002) % 2 === 0;
      beaconMat.color.setHex(isBlink ? 0xffd54f : 0xff9100);
      windowWireMat.opacity = 0.55 + Math.sin(time * 0.003) * 0.15;

      // Memory 03 (Message)
      const msgPulseRate = currentActiveDiscovery === 'message' ? 0.003 : 0.008;
      msgCore.rotation.y += msgPulseRate;
      msgCore.rotation.x += msgPulseRate * 0.5;
      msgWire.rotation.y -= msgPulseRate * 0.6;
      msgRing1.rotation.z += 0.006 * movementDamping;
      msgRing2Mesh.rotation.x -= 0.005 * movementDamping;
      messageGroup.position.y = MEMORIES_DATA.message.position[1] + Math.sin(time * 0.0016 + 3.0) * 0.08;
      const msgScalePulse = 1 + Math.sin(time * 0.0025) * 0.04;
      msgCore.scale.setScalar(msgScalePulse);

      // Environmental Storytelling Anims
      const cursorBlink = Math.floor(time * 0.0025) % 2 === 0;
      crtCursorMat.opacity = cursorBlink ? 0.9 : 0.1;

      const diodeBlink = Math.floor(time * 0.0018) % 2 === 0;
      diodeMat.color.setHex(diodeBlink ? 0xf87171 : 0x7f1d1d);

      // Fragments Shimmer
      fragmentMeshesRef.current.forEach((fm, idx) => {
        fm.shard.rotation.y += 0.012;
        fm.shard.rotation.x += 0.006;
        fm.shard.position.y = Math.sin(time * 0.002 + idx * 1.2) * 0.05;
        fm.ring.rotation.z += 0.008;
      });

      // The World Watches Back
      const camTheta = orbitAngle.current.theta % (Math.PI * 2);
      const isLookingAtRuins = Math.abs(camTheta - 2.5) < 0.8 || Math.abs(camTheta + 3.78) < 0.8;

      if (isLookingAtRuins && time - lastWatcherTriggerTime.current > 18000) {
        lastWatcherTriggerTime.current = time;
        watchingBeaconIntensity.current = 1.8;
      }

      watchingBeaconIntensity.current = Math.max(0, watchingBeaconIntensity.current - delta * 0.35);
      watcherLight.intensity = watchingBeaconIntensity.current;

      const isFlicker = Math.sin(time * 0.008) > 0.6 && Math.cos(time * 0.012) > 0.3;
      distantLightMat.color.setHex(isFlicker ? 0xbae6fd : 0x0284c7);

      if (time - glanceFlickerTime.current > 26000) {
        glanceFlickerTime.current = time;
      }
      const timeSinceGlance = time - glanceFlickerTime.current;
      if (timeSinceGlance < 600) {
        distantLightMesh.scale.setScalar(1.5);
      } else {
        distantLightMesh.scale.setScalar(1.0);
      }

      // Secret Signal (If active)
      if (isAllRecovered) {
        secretGroup.visible = true;
        secretCore.rotation.y += 0.01;
        secretCore.rotation.x += 0.008;
        secretRing.rotation.z += 0.012;
        const secretPulse = Math.sin(time * 0.003) * 0.2 + 0.8;
        secretRing.scale.setScalar(secretPulse);
        secretLabelMesh.quaternion.copy(camera.quaternion);
      }

      // Anchors always face camera
      oceanAnchor.quaternion.copy(camera.quaternion);
      cityAnchor.quaternion.copy(camera.quaternion);
      messageAnchor.quaternion.copy(camera.quaternion);
      coreLabelMesh.quaternion.copy(camera.quaternion);
      termLabel.quaternion.copy(camera.quaternion);
      transLabel.quaternion.copy(camera.quaternion);

      // Camera Lerp & Damping
      if (!isDragging.current && !currentActiveDiscovery) {
        targetOrbitAngle.current.theta += 0.0004;
      }

      if (!currentActiveDiscovery) {
        orbitAngle.current.theta += (targetOrbitAngle.current.theta - orbitAngle.current.theta) * 0.08;
        orbitAngle.current.phi += (targetOrbitAngle.current.phi - orbitAngle.current.phi) * 0.08;
        orbitAngle.current.radius += (targetOrbitAngle.current.radius - orbitAngle.current.radius) * 0.08;

        const sinPhi = Math.sin(orbitAngle.current.phi);
        const cosPhi = Math.cos(orbitAngle.current.phi);
        const sinTheta = Math.sin(orbitAngle.current.theta);
        const cosTheta = Math.cos(orbitAngle.current.theta);
        const r = orbitAngle.current.radius;

        targetCamPos.current.set(
          r * sinPhi * sinTheta,
          r * cosPhi + 0.8,
          r * sinPhi * cosTheta
        );
      }

      currentCamPos.current.lerp(targetCamPos.current, camLerpSpeed.current);
      currentCamLook.current.lerp(targetCamLook.current, camLerpSpeed.current);

      camera.position.copy(currentCamPos.current);
      camera.lookAt(currentCamLook.current);

      // Adaptive Spatial Audio Update (Lightweight math + AudioParam lerp, zero RAF allocations)
      try {
        soundEngine.updateSpatialState(
          currentCamPos.current,
          currentActiveDiscovery,
          isAllRecovered,
          Boolean(currentActiveDiscovery)
        );
      } catch {}

      renderer.render(scene, camera);
    } catch (err) {
      console.warn("Animation render loop error:", err);
    }
  };

    animFrameId.current = requestAnimationFrame(animate);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth || window.innerWidth);
      const h = Math.max(1, container.clientHeight || window.innerHeight);
      const mob = w < 768;
      camera.fov = mob ? 52 : 46;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      try {
        renderer.dispose();
        scene.clear();
      } catch {}
      isSceneInitialized.current = false;
    };
  }, [onSceneReady]);

  // ----------------------------------------------------
  // INTERACTION HANDLERS (Touch & Pointer for Mobile First)
  // ----------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || activeDiscoveryRef.current) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    dragStart.current.x = e.clientX;
    dragStart.current.y = e.clientY;

    const sensitivity = 0.005;
    targetOrbitAngle.current.theta -= deltaX * sensitivity;
    targetOrbitAngle.current.phi = Math.max(
      0.25,
      Math.min(Math.PI / 2 + 0.35, targetOrbitAngle.current.phi - deltaY * sensitivity)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    const duration = Date.now() - dragStart.current.time;

    // Quick tap/click (< 12px movement & < 400ms duration)
    if (dist < 12 && duration < 400) {
      performRaycast(e.clientX, e.clientY);
    }
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDist.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartRadius.current = targetOrbitAngle.current.radius;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null && !activeDiscoveryRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = pinchStartDist.current / currentDist;
      targetOrbitAngle.current.radius = Math.max(6.5, Math.min(16.0, pinchStartRadius.current * ratio));
    }
  };

  const handleTouchEnd = () => {
    pinchStartDist.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (activeDiscoveryRef.current) return;
    const zoomFactor = e.deltaY * 0.005;
    targetOrbitAngle.current.radius = Math.max(
      6.5,
      Math.min(16.0, targetOrbitAngle.current.radius + zoomFactor)
    );
  };

  // Screen-space proximity raycasting for flawless mobile and desktop tapping
  const performRaycast = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);

    const cam = new THREE.PerspectiveCamera(
      width < 768 ? 52 : 46,
      width / height,
      0.1,
      120
    );
    cam.position.copy(currentCamPos.current);
    cam.lookAt(currentCamLook.current);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();

    // 1. Check Hidden Archival Fragments first (highest precision)
    for (const frag of ARCHIVAL_FRAGMENTS) {
      const worldPos = new THREE.Vector3(...frag.position);
      worldPos.project(cam);
      if (worldPos.z < 1) {
        const screenX = ((worldPos.x + 1) * width) / 2;
        const screenY = ((-worldPos.y + 1) * height) / 2;
        const dist = Math.hypot(clientX - rect.left - screenX, clientY - rect.top - screenY);
        if (dist < 46) {
          onDiscoverFragmentRef.current(frag.id);
          return;
        }
      }
    }

    // 2. Targets to check: 3 Memories + Central Node + Environmental Objects + Secret Signal
    const targets: { id: DiscoveryId; position: [number, number, number]; radius: number }[] = [
      { id: 'ocean', position: MEMORIES_DATA.ocean.position, radius: 78 },
      { id: 'city', position: MEMORIES_DATA.city.position, radius: 78 },
      { id: 'message', position: MEMORIES_DATA.message.position, radius: 78 },
      { id: 'archive_core', position: [0, 0, 0], radius: 85 },
      { id: 'terminal', position: ENVIRONMENTAL_OBJECTS.terminal.position, radius: 65 },
      { id: 'transceiver', position: ENVIRONMENTAL_OBJECTS.transceiver.position, radius: 65 },
    ];

    if (recoveredIdsRef.current.length === 3) {
      targets.push({ id: 'secret_signal', position: SECRET_SIGNAL_DATA.position, radius: 85 });
    }

    let closestId: DiscoveryId | null = null;
    let closestDist = Infinity;

    targets.forEach((t) => {
      const worldPos = new THREE.Vector3(...t.position);
      worldPos.project(cam);

      if (worldPos.z < 1) {
        const screenX = ((worldPos.x + 1) * width) / 2;
        const screenY = ((-worldPos.y + 1) * height) / 2;
        const dist = Math.hypot(clientX - rect.left - screenX, clientY - rect.top - screenY);

        if (dist < t.radius && dist < closestDist) {
          closestDist = dist;
          closestId = t.id;
        }
      }
    });

    if (closestId) {
      soundEngine.playUiClick();
      onSelectDiscoveryRef.current(closestId);
    }
  };

  if (!webGlSupported) {
    return (
      <div
        id="webgl-fallback-container"
        className="absolute inset-0 bg-[#020306] flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <div className="max-w-md w-full border border-cyan-500/40 bg-black/80 backdrop-blur-md p-6 rounded-lg space-y-4 text-left font-mono">
          <div className="text-cyan-400 font-bold text-xs tracking-[0.25em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>TERMINAL OVERRIDE // 2098</span>
          </div>
          <p className="text-sm text-slate-300">
            WebGL acceleration is unavailable on this terminal. You may inspect the recovered records directly below:
          </p>
          <div className="space-y-2 pt-2">
            {(['ocean', 'city', 'message'] as MemoryId[]).map((id) => (
              <button
                key={id}
                onClick={() => onSelectDiscovery(id)}
                className="w-full text-left p-3 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs tracking-wider flex justify-between items-center cursor-pointer"
              >
                <span>{MEMORIES_DATA[id].title}</span>
                <span className="text-slate-500 text-[10px]">&bull; OPEN RECORD</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="archive-3d-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {isLoading && (
        <div
          id="scene-loader-overlay"
          className="absolute inset-0 bg-[#020306] flex items-center justify-center font-mono text-xs text-cyan-400/80 tracking-[0.3em] uppercase select-none pointer-events-none"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>INITIALIZING WEBGL CORE CHAMBER...</span>
          </div>
        </div>
      )}
    </div>
  );
};
