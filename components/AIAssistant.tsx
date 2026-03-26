import React, { useState } from 'react';
import { Bot, Loader2, Sparkles, MessageSquare, Settings2, KeyRound } from 'lucide-react';
import { AIProvider } from '../types';

interface AIAssistantProps {
  onGenerate: (topic: string, provider: AIProvider, model: string, key?: string) => Promise<void>;
  onExplain: (provider: AIProvider, model: string, key?: string) => Promise<void>;
  aiLoading: boolean;
  aiMessage: string | null;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onGenerate,
  onExplain,
  aiLoading,
  aiMessage
}) => {
  const [topic, setTopic] = useState('');
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !isConfigured) return;
    onGenerate(topic, provider, model, apiKey);
  };

  const handleExplain = () => {
      if (!isConfigured) return;
      onExplain(provider, model, apiKey);
  };

  const handleConfirmSettings = () => {
      if (apiKey.trim()) {
          setIsConfigured(true);
          setShowSettings(false);
      } else {
          alert('请输入 API Key 以启用 AI 功能');
      }
  };

  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (推荐)', provider: 'gemini' as AIProvider },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'deepseek' as AIProvider },
  ];

  const handleModelChange = (modelId: string) => {
    const selected = models.find(m => m.id === modelId);
    if (selected) {
      setModel(selected.id);
      setProvider(selected.provider);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 h-full">
      <div className="flex justify-between items-center text-purple-600 mb-1">
        <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <h3 className="font-bold text-lg">AI 助手</h3>
        </div>
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-colors ${showSettings ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
            title="设置模型"
        >
            <Settings2 size={18} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm mb-2 animate-in fade-in slide-in-from-top-2 space-y-4">
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">1. 选择对应大模型</label>
                  <select 
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:border-purple-500 outline-none bg-white font-medium"
                  >
                      {models.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                  </select>
              </div>

              <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      <KeyRound size={12} />
                      2. 输入 API Key
                  </label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'gemini' ? "请输入 Google Gemini API Key" : "请输入 DeepSeek API Key (sk-...)"}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:border-purple-500 outline-none text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                      {provider === 'gemini' 
                        ? '请提供有效的 Google AI Studio API Key。' 
                        : '请提供有效的 DeepSeek API Key。'}
                  </p>
              </div>

              <button
                onClick={handleConfirmSettings}
                className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-sm"
              >
                确认配置
              </button>
          </div>
      )}

      {/* Main UI (Only active after configuration) */}
      <div className={!isConfigured ? 'opacity-40 pointer-events-none' : ''}>
          {/* Generation Form */}
          <form onSubmit={handleGenerate} className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500">生成场景</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：城市交通、石油管道"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
              <button
                type="submit"
                disabled={aiLoading || !topic || !isConfigured}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={18} /> : '生成'}
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 my-3"></div>

          {/* Explain Button */}
          <button
            onClick={handleExplain}
            disabled={aiLoading || !isConfigured}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors font-bold text-sm shadow-sm"
          >
            <Bot size={18} />
            解释当前步骤
          </button>
      </div>

      {!isConfigured && !showSettings && (
          <div className="text-center py-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">请先点击右上角设置图标完成 AI 配置</p>
          </div>
      )}

      {/* AI Output Area */}
      <div className="flex-1 min-h-[150px] bg-slate-50 rounded-lg p-3 text-sm text-slate-700 overflow-y-auto border border-slate-100 mt-2">
        {aiLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={16} />
            思考中...
          </div>
        ) : aiMessage ? (
            <div className="flex gap-2">
                <MessageSquare className="shrink-0 text-purple-500 mt-1" size={16} />
                <p className="leading-relaxed whitespace-pre-wrap">{aiMessage}</p>
            </div>
        ) : (
          <span className="text-slate-400 italic">AI 的见解将显示在这里...</span>
        )}
      </div>
    </div>
  );
};
