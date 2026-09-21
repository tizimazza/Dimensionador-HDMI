import React from 'react';
import { SizingResult, ProjectInputs } from '../types';
import { Monitor, Laptop, Server, Network } from 'lucide-react';

interface DiagramProps {
  sizing: SizingResult;
  inputs: ProjectInputs;
}

export function Diagram({ sizing, inputs }: DiagramProps) {
  if (sizing.isUnsupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
        <Server className="w-12 h-12 text-red-400 mb-3" />
        <h3 className="text-red-800 font-bold mb-2">Fora dos Padrões (Custom)</h3>
        <p className="text-red-600 text-sm">{sizing.unsupportedReason}</p>
      </div>
    );
  }

  const hasCentralEq = !!sizing.diagramData.equipmentName;
  const isAvIp = !!sizing.diagramData.isAvIp;
  const sourcesToShow = Math.min(sizing.diagramData.sources.length, 4);
  const displaysToShow = Math.min(sizing.diagramData.displays.length, 4);
  
  const sourcesHidden = sizing.diagramData.sources.length - sourcesToShow;
  const displaysHidden = sizing.diagramData.displays.length - displaysToShow;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col lg:flex-row items-center justify-center gap-6 overflow-hidden">
      
      {/* Sources */}
      <div className="flex flex-col gap-4">
        {Array(sourcesToShow).fill(0).map((_, i) => (
          <div key={`src-${i}`} className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white border-2 border-slate-300 rounded flex items-center justify-center shadow-sm relative z-10">
              <Laptop className="w-6 h-6 text-slate-600" />
              {isAvIp && <div className="absolute -bottom-2 -right-2 bg-blue-100 border border-blue-300 text-xs text-blue-800 font-bold px-1 rounded">TX</div>}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">Fonte {i + 1}</span>
          </div>
        ))}
        {sourcesHidden > 0 && (
          <div className="text-xs text-slate-400 font-bold italic">+ {sourcesHidden} fontes</div>
        )}
      </div>

      {/* Connection / Central Eq */}
      <div className="flex-1 min-w-[100px] flex items-center justify-center relative">
        <div className="absolute w-full h-[2px] bg-blue-300 z-0"></div>
        
        {hasCentralEq && (
          <div className="bg-white border-2 border-blue-500 p-4 rounded-lg shadow-md z-10 text-center relative">
            {isAvIp ? <Network className="w-8 h-8 text-blue-600 mx-auto mb-2" /> : <Server className="w-8 h-8 text-blue-600 mx-auto mb-2" />}
            <div className="text-xs font-bold text-slate-800 max-w-[120px] mx-auto leading-tight">
              {sizing.diagramData.equipmentName}
            </div>
            {isAvIp && (
              <div className="text-[10px] text-blue-600 mt-1 uppercase font-semibold">Rede Local</div>
            )}
          </div>
        )}
      </div>

      {/* Displays */}
      <div className="flex flex-col gap-4">
        {Array(displaysToShow).fill(0).map((_, i) => (
          <div key={`disp-${i}`} className="flex flex-col items-center">
            <div className="w-14 h-14 bg-slate-800 border-2 border-slate-700 rounded flex items-center justify-center shadow-md relative z-10">
              <Monitor className="w-8 h-8 text-blue-400" />
              {isAvIp && <div className="absolute -bottom-2 -left-2 bg-blue-100 border border-blue-300 text-xs text-blue-800 font-bold px-1 rounded">RX</div>}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">Tela {i + 1}</span>
          </div>
        ))}
        {displaysHidden > 0 && (
          <div className="text-xs text-slate-400 font-bold italic">+ {displaysHidden} telas</div>
        )}
      </div>

    </div>
  );
}
