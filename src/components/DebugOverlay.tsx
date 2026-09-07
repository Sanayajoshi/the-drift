import React from 'react';
import { Ship, MassNode, ExpeditionStats, Vector2D } from '../types/game';

interface DebugOverlayProps {
  ship: Ship;
  stats: ExpeditionStats;
  fps: number;
  dt: number;
  massNodes: MassNode[];
  gatePosition: Vector2D;
  onRefillEnergy: () => void;
  onResetHull: () => void;
  onRegenerateSector: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  ship,
  stats,
  fps,
  dt,
  massNodes,
  gatePosition,
  onRefillEnergy,
  onResetHull,
  onRegenerateSector,
}) => {
  const currentSpeed = Math.hypot(ship.velocity.x, ship.velocity.y);
  const distToGate = Math.hypot(ship.position.x - gatePosition.x, ship.position.y - gatePosition.y);

  // Find nearest mass node
  let nearestNode: MassNode | null = null;
  let nearestDist = Infinity;
  for (const n of massNodes) {
    const d = Math.hypot(ship.position.x - n.position.x, ship.position.y - n.position.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearestNode = n;
    }
  }

  return (
    <div id="developer-debug-panel" className="absolute top-24 left-4 z-20 bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 font-mono text-[11px] text-emerald-400 pointer-events-auto shadow-2xl backdrop-blur-md max-w-xs">
      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1.5 mb-2">
        <span className="font-bold tracking-wider text-emerald-300">DEBUG OVERLAY [F3]</span>
        <span className="text-xs font-bold text-slate-200">{fps} FPS</span>
      </div>

      <div className="flex flex-col gap-1 text-slate-300">
        <div>DELTA TIME: <span className="text-emerald-400">{(dt * 1000).toFixed(1)}ms</span></div>
        <div>POS: <span className="text-emerald-400">{Math.round(ship.position.x)}, {Math.round(ship.position.y)}</span></div>
        <div>VEL: <span className="text-emerald-400">{ship.velocity.x.toFixed(1)}, {ship.velocity.y.toFixed(1)}</span></div>
        <div>SPEED: <span className="text-emerald-400">{currentSpeed.toFixed(1)} u/s</span></div>
        <div>ROT: <span className="text-emerald-400">{(ship.rotation * 180 / Math.PI).toFixed(0)}°</span></div>
        <div>ENERGY: <span className="text-emerald-400">{ship.energy.toFixed(1)} / {ship.maxEnergy}</span></div>
        <div>HULL: <span className="text-emerald-400">{ship.hull.toFixed(1)} / {ship.maxHull}</span></div>
        <div>DIST TO GATE: <span className="text-emerald-400">{Math.round(distToGate)}u</span></div>
        {nearestNode && (
          <div>
            NEAREST NODE: <span className="text-emerald-400">{nearestNode.id} ({Math.round(nearestDist)}u)</span>
          </div>
        )}
        <div>FLOW MULT: <span className="text-emerald-400">{stats.flowMultiplier.toFixed(2)}x</span></div>
      </div>

      {/* Debug shortcut triggers */}
      <div className="mt-3 pt-2 border-t border-emerald-500/30 flex flex-col gap-1 text-[10px]">
        <div className="text-slate-400 font-semibold mb-0.5">DEV SHORTCUTS:</div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={onRefillEnergy}
            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded text-emerald-300 cursor-pointer"
          >
            F6: Refill Energy
          </button>
          <button
            onClick={onResetHull}
            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded text-emerald-300 cursor-pointer"
          >
            F7: Repair Hull
          </button>
          <button
            onClick={onRegenerateSector}
            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded text-emerald-300 cursor-pointer"
          >
            F5: New Sector
          </button>
        </div>
      </div>
    </div>
  );
};
