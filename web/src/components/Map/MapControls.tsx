import React from 'react';
import {
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Sliders,
  Maximize2,
  Box,
  Layers,
} from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onResetBearing: () => void;
  onTogglePitch: () => void;
  onToggleFullscreen: () => void;
  is3d: boolean;
  opacity: number;
  onOpacityChange: (newOpacity: number) => void;
  borderStyle: 'white' | 'dark' | 'none';
  onBorderStyleChange: (style: 'white' | 'dark' | 'none') => void;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onResetBearing,
  onTogglePitch,
  onToggleFullscreen,
  is3d,
  opacity,
  onOpacityChange,
  borderStyle,
  onBorderStyleChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 select-none ${className}`}>
      {/* Navigation cluster */}
      <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-xl p-1 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
        <button
          onClick={onZoomIn}
          title="Zoom In (+)"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom Out (-)"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={onResetBearing}
          title="Reset Compass (North)"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Compass size={16} />
        </button>
        <button
          onClick={onTogglePitch}
          title={is3d ? 'Switch to 2D Top View' : 'Switch to 3D Perspective Pitch'}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            is3d
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Box size={16} />
        </button>
        <button
          onClick={onResetView}
          title="Reset to All-India View"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Layer settings popup badge */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 shadow-lg space-y-2 text-xs">
        {/* Opacity control */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sliders size={12} className="text-indigo-600" />
            <span>Opacity</span>
          </span>
          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round(opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-24 accent-indigo-600 cursor-pointer block"
        />

        {/* Boundary border switch */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Layers size={11} />
            <span>Borders</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
            <button
              onClick={() => onBorderStyleChange('white')}
              className={`py-0.5 rounded cursor-pointer ${
                borderStyle === 'white'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              White
            </button>
            <button
              onClick={() => onBorderStyleChange('dark')}
              className={`py-0.5 rounded cursor-pointer ${
                borderStyle === 'dark'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => onBorderStyleChange('none')}
              className={`py-0.5 rounded cursor-pointer ${
                borderStyle === 'none'
                  ? 'bg-slate-400 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls;
