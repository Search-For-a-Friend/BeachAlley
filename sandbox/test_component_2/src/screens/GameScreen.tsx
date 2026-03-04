import React, { useState, useEffect, useRef } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';
import { TerrainMap } from '../types/environment';
import { GameEngine } from '../game/engine';
import { GameState } from '../types';
import RecruitmentModal from '../components/RecruitmentModal';
import { RecruitmentState, StaffCandidate } from '../types/recruitment';

interface GameScreenProps {
  onBackToMenu: () => void;
  terrainMap: TerrainMap;
  environmentName: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  onBackToMenu,
  terrainMap,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [recruitmentState, setRecruitmentState] = useState<RecruitmentState | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const handleTryBuild = (row: number, col: number, building: { icon: string; name: string; price: string }, rotation: number) => {
    const engine = engineRef.current;
    if (!engine) return false;
    const ok = engine.tryBuildEstablishment(row, col, building, rotation);
    setGameState(engine.getState());
    
    // Check if recruitment started
    const newRecruitmentState = engine.getRecruitmentState();
    if (newRecruitmentState) {
      setRecruitmentState(newRecruitmentState);
    }
    
    return ok;
  };

  const handleHireCandidate = (candidate: StaffCandidate) => {
    const engine = engineRef.current;
    if (!engine || !recruitmentState) return;
    
    engine.hireCandidate(recruitmentState.establishmentId, candidate);
    setGameState(engine.getState());
    
    // Update recruitment state
    const newRecruitmentState = engine.getRecruitmentState();
    setRecruitmentState(newRecruitmentState);
  };

  const handleRerollCandidates = (premium: boolean) => {
    const engine = engineRef.current;
    if (!engine || !recruitmentState) return;
    
    const success = engine.rerollCandidates(recruitmentState.establishmentId, premium);
    if (success) {
      setGameState(engine.getState());
      const newRecruitmentState = engine.getRecruitmentState();
      setRecruitmentState(newRecruitmentState);
    }
  };

  const handleSkipRecruitment = () => {
    const engine = engineRef.current;
    if (!engine || !recruitmentState) return;
    
    engine.skipRecruitment(recruitmentState.establishmentId);
    setGameState(engine.getState());
    
    // Update recruitment state
    const newRecruitmentState = engine.getRecruitmentState();
    setRecruitmentState(newRecruitmentState);
  };

  const handleCloseRecruitment = () => {
    // Close modal but keep recruitment state active
    setRecruitmentState(null);
  };

  const handleStartRecruitmentFromDrawer = (establishmentId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    
    engine.startRecruitment(establishmentId);
    setGameState(engine.getState());
    
    // Check if recruitment started
    const newRecruitmentState = engine.getRecruitmentState();
    if (newRecruitmentState) {
      setRecruitmentState(newRecruitmentState);
    }
  };

  useEffect(() => {
    const engine = new GameEngine(
      { canvasWidth: 800, canvasHeight: 600 },
      terrainMap
    );
    engineRef.current = engine;
    setGameState(engine.getState());

    let lastTime = performance.now();
    let rafId: number;

    const loop = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      lastTime = now;
      engine.update(deltaTime);
      setGameState(engine.getState());
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      engineRef.current = null;
    };
  }, [terrainMap]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        maxHeight: '-webkit-fill-available',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <LayoutTabbed
        onBack={onBackToMenu}
        onChangeLayout={() => {}}
        terrainMap={terrainMap}
        gameState={gameState}
        gridManager={engineRef.current?.getGridManager()}
        onTryBuild={handleTryBuild}
        onStartRecruitment={handleStartRecruitmentFromDrawer}
      />
      
      {/* Recruitment Modal */}
      {recruitmentState && (
        <RecruitmentModal
          recruitmentState={recruitmentState}
          onHireCandidate={handleHireCandidate}
          onRerollCandidates={handleRerollCandidates}
          onSkipRecruitment={handleSkipRecruitment}
          onClose={handleCloseRecruitment}
          playerMoney={gameState?.money || 0}
        />
      )}
    </div>
  );
};

export default GameScreen;
