import React from 'react';
import { Play, SkipForward, RotateCcw, Trash2, MousePointer2, PlusCircle, ArrowRightCircle, MapPin, Flag, XCircle } from 'lucide-react';
import { AlgorithmPhase, ToolType, SelectionState, AppStage, Graph } from '../types';

interface ControlPanelProps {
  phase: AlgorithmPhase;
  appStage: AppStage;
  graph: Graph;
  activeTool: ToolType;
  selection: SelectionState | null;
  onToolChange: (tool: ToolType) => void;
  onStep: () => void;
  onReset: () => void;
  onClear: () => void;
  onClearGraph: () => void;
  onDeleteSelected: () => void;
  onUpdateEdgeCapacity: (id: string, capacity: number) => void;
  onAutoPlay: () => void;
  isAutoPlaying: boolean;
  onFinishConstruction: () => void;
  onStartSolving: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  phase,
  appStage,
  graph,
  activeTool,
  selection,
  onToolChange,
  onStep,
  onReset,
  onClear,
  onClearGraph,
  onDeleteSelected,
  onUpdateEdgeCapacity,
  onAutoPlay,
  isAutoPlaying,
  onFinishConstruction,
  onStartSolving
}) => {

  const tools = [
    { id: 'SELECT', icon: MousePointer2, label: '选择/移动' },
    { id: 'ADD_NODE', icon: PlusCircle, label: '添加节点' },
    { id: 'ADD_EDGE', icon: ArrowRightCircle, label: '添加连线' },
    { id: 'SET_SOURCE', icon: MapPin, label: '设为起点' },
    { id: 'SET_SINK', icon: Flag, label: '设为终点' },
    { id: 'DELETE', icon: XCircle, label: '橡皮擦' },
  ] as const;

  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      
      {/* Control Toolbox */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">控制工具箱</h3>
        
        {/* Tool Grid - only active in CONSTRUCTION */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id as ToolType)}
              disabled={appStage !== AppStage.CONSTRUCTION}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all ${
                activeTool === tool.id 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
              } ${appStage !== AppStage.CONSTRUCTION ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={tool.label}
            >
              <tool.icon size={20} className="mb-1" />
              <span className="scale-90">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Stage Control Buttons */}
        <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <button 
            onClick={onFinishConstruction}
            disabled={appStage !== AppStage.CONSTRUCTION}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              appStage === AppStage.CONSTRUCTION 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <SkipForward size={16} />
            1. 建构完毕
          </button>
          
          <button 
            onClick={onStartSolving}
            disabled={appStage !== AppStage.SOLVING || isAutoPlaying || phase === AlgorithmPhase.FINISHED}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              appStage === AppStage.SOLVING && !isAutoPlaying && phase !== AlgorithmPhase.FINISHED
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play size={16} />
            2. 计算求解
          </button>
          
          <button 
            onClick={onClear}
            disabled={appStage !== AppStage.FINISHED}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              appStage === AppStage.FINISHED 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={16} />
            3. 恢复重置
          </button>
        </div>
        
        {/* Selection Actions */}
        {selection && appStage === AppStage.CONSTRUCTION && (
             <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-600 font-bold uppercase tracking-tight">
                        已选择: {selection.type === 'node' ? '节点' : '连线'} {selection.id}
                    </span>
                    <button 
                        onClick={onDeleteSelected}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                        title="删除选中项"
                    >
                        <Trash2 size={16} />
                    </button>
                 </div>

                 {selection.type === 'edge' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        <label className="text-xs text-slate-500 font-medium">容量:</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="999"
                            value={graph.edges.find(e => e.id === selection.id)?.capacity || 0}
                            onChange={(e) => onUpdateEdgeCapacity(selection.id, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-600"
                        />
                    </div>
                 )}
             </div>
        )}
      </div>

      <div className="border-t border-slate-100"></div>

      {/* Playback Controls - only visible in SOLVING or FINISHED */}
      {appStage !== AppStage.CONSTRUCTION && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">运行控制</h3>
          <div className="flex gap-2 mb-3">
              <button
              onClick={onStep}
              disabled={isAutoPlaying || phase === AlgorithmPhase.FINISHED}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
              <SkipForward size={18} />
              单步
              </button>

              <button
              onClick={onAutoPlay}
              disabled={phase === AlgorithmPhase.FINISHED}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm ${
                  isAutoPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
              <Play size={18} />
              {isAutoPlaying ? '暂停' : '自动'}
              </button>
          </div>

          <div className="flex gap-2">
              <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-xs font-medium"
              >
              <RotateCcw size={14} />
              重置流量
              </button>
              <button
              onClick={onClearGraph}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs font-medium"
              >
              <Trash2 size={14} />
              清空图表
              </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-slate-400 mt-auto bg-slate-50 p-2 rounded">
        {activeTool === 'SELECT' && '点击选中节点或连线 (Delete键删除)。拖动可调整布局。'}
        {activeTool === 'ADD_NODE' && '点击空白处添加新节点。'}
        {activeTool === 'ADD_EDGE' && '拖动连接两个节点以添加边 (随机容量)。'}
        {activeTool === 'SET_SOURCE' && '点击节点将其设为源点 (s)。'}
        {activeTool === 'SET_SINK' && '点击节点将其设为汇点 (t)。'}
        {activeTool === 'DELETE' && '点击节点或连线直接删除。'}
      </div>
    </div>
  );
};