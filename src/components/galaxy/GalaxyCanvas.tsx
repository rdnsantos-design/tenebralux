import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet, Faction, FACTION_NAME_TO_ID } from '@/types/galaxy';

interface GalaxyCanvasProps {
  planets: Planet[];
  factions: Faction[];
  selectedPlanet: Planet | null;
  onSelectPlanet: (planet: Planet | null) => void;
  showLabels: boolean;
  showConnections: boolean;
  planetScale: number;
}

// Componente para um planeta individual
function PlanetSphere({ 
  planet, 
  factionColor, 
  isSelected,
  onSelect,
  showLabel,
  planetScale
}: { 
  planet: Planet; 
  factionColor: string;
  isSelected: boolean;
  onSelect: () => void;
  showLabel: boolean;
  planetScale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Tamanho baseado no Tier e escala
  const size = useMemo(() => {
    const baseSize = 0.3;
    return (baseSize + (planet.tier * 0.15)) * planetScale;
  }, [planet.tier, planetScale]);

  // Opacidade baseada no Tier
  const opacity = useMemo(() => {
    const opacities = [0.4, 0.55, 0.7, 0.85, 1];
    return opacities[planet.tier - 1];
  }, [planet.tier]);

  // Escala de coordenadas (os dados estão em anos-luz, precisamos escalar)
  const scale = 0.1;
  const position: [number, number, number] = [
    planet.x * scale,
    planet.y * scale,
    planet.z * scale
  ];

  // Animação de pulsação para selecionado/hover
  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  // Terra destruída tem tratamento especial
  const isTerra = planet.nome === 'Terra (Destruída)';
  const color = isTerra ? '#ff0000' : factionColor;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : planet.tier === 5 ? 0.2 : 0.1}
        />
      </mesh>

      {/* Glow para planetas Tier 5 ou selecionados */}
      {(planet.tier === 5 || isSelected) && (
        <mesh>
          <sphereGeometry args={[size * 1.3, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}

      {/* Label do planeta */}
      {(showLabel || hovered || isSelected) && (
        <Html
          position={[0, size + 0.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <div 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: 'rgba(10, 10, 15, 0.9)',
              color: hovered || isSelected ? color : '#ffffff',
              border: `1px solid ${color}`,
              fontSize: '10px'
            }}
          >
            {planet.nome}
            {hovered && !isSelected && (
              <span className="ml-1 opacity-70">• {planet.faccao}</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Componente para a Via Victoria (linha dourada)
function ViaVictoria({ planets }: { planets: Planet[] }) {
  const geometry = useMemo(() => {
    const viaVictoriaPlanets = planets
      .filter(p => p.regiao.startsWith('Via Victoria'))
      .sort((a, b) => a.distancia - b.distancia);

    if (viaVictoriaPlanets.length < 2) return null;

    const scale = 0.1;
    const points = viaVictoriaPlanets.map(p => 
      new THREE.Vector3(p.x * scale, p.y * scale, p.z * scale)
    );

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(100);
    
    const geo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    return geo;
  }, [planets]);

  if (!geometry) return null;

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
      color: '#f39c12', 
      opacity: 0.6, 
      transparent: true 
    }))} />
  );
}

// Terra no centro (destruída)
function DestroyedEarth() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Núcleo vermelho pulsante */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#8b0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Anel de detritos */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 32]} />
        <meshStandardMaterial
          color="#555555"
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

// Componente principal do Canvas
function GalaxyScene({
  planets,
  factions,
  selectedPlanet,
  onSelectPlanet,
  showLabels,
  showConnections,
  planetScale
}: GalaxyCanvasProps) {
  const { camera } = useThree();

  // Mapa de cores por facção
  const factionColors = useMemo(() => {
    const colors: Record<string, string> = {};
    factions.forEach(f => {
      colors[f.name] = f.color;
    });
    // Fallbacks
    colors['Aliança Estelar'] = colors['Aliança Estelar'] || '#3498db';
    colors['Hegemonia Humanista'] = colors['Hegemonia Humanista'] || '#e74c3c';
    colors['Pacto de Liberstadt'] = colors['Pacto de Liberstadt'] || '#2ecc71';
    colors['Federação Solônica'] = colors['Federação Solônica'] || '#f39c12';
    colors['Nova Concórdia'] = colors['Nova Concórdia'] || '#95a5a6';
    colors['Independente'] = colors['Independente'] || '#7f8c8d';
    colors['Synaxis'] = colors['Synaxis'] || '#1abc9c';
    colors['República Bruniana'] = colors['República Bruniana'] || '#9b59b6';
    colors['Zona Fantasma'] = colors['Zona Fantasma'] || '#2c3e50';
    colors['Zona Disputada'] = colors['Zona Disputada'] || '#e67e22';
    return colors;
  }, [factions]);

  return (
    <>
      {/* Iluminação */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      {/* Estrelas de fundo */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Via Victoria */}
      {showConnections && <ViaVictoria planets={planets} />}

      {/* Planetas */}
      {planets.map(planet => (
        <PlanetSphere
          key={planet.id}
          planet={planet}
          factionColor={factionColors[planet.faccao] || '#7f8c8d'}
          isSelected={selectedPlanet?.id === planet.id}
          onSelect={() => onSelectPlanet(planet)}
          showLabel={showLabels}
          planetScale={planetScale}
        />
      ))}

      {/* Controles de órbita */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={100}
      />
    </>
  );
}

export function GalaxyCanvas(props: GalaxyCanvasProps) {
  return (
    <div className="w-full h-full" style={{ background: '#0a0a0f' }}>
      <Canvas
        camera={{ position: [0, 15, 30], fov: 60 }}
        onPointerMissed={() => props.onSelectPlanet(null)}
      >
        <GalaxyScene {...props} />
      </Canvas>
    </div>
  );
}
