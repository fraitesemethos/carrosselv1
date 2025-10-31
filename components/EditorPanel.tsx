import React, { useState } from 'react';
import { AdCreative, AspectRatio, EditorSettings } from '../types';
import { FONT_FACES, LAYOUT_PRESETS } from '../constants';
import Button from './ui/Button';
import Loader from './ui/Loader';

interface EditorPanelProps {
  creative: AdCreative;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  aspectRatios: AspectRatio[];
  activeAspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onDownload: () => void;
  onBack: () => void;
  previewScale: number;
  onScaleChange: (scale: number) => void;
  onSaveToHistory: (creative: AdCreative) => void;
  onApplyPreset: (settings: EditorSettings) => void;
  onGenerateAudio: () => Promise<void>;
  onRemoveAudio: () => void;
}

const TextAlignIcon: React.FC<{ alignment: 'left' | 'center' | 'right' }> = ({ alignment }) => {
    const paths = {
        left: (
            <>
                <path d="M3 4h18v2H3V4zm0 5h12v2H3V9zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
            </>
        ),
        center: (
            <>
                <path d="M3 4h18v2H3V4zm3 5h12v2H6V9zm-3 5h18v2H3v-2zm3 5h12v2H6v-2z" />
            </>
        ),
        right: (
             <>
                <path d="M3 4h18v2H3V4zm9 5h9v2H12V9zm-9 5h18v2H3v-2zm9 5h9v2H12v-2z" />
            </>
        ),
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            {paths[alignment]}
        </svg>
    )
}

const StyleIcon: React.FC<{ type: 'bold' | 'italic' | 'underline' }> = ({ type }) => {
    const paths = {
        bold: <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 4h5.5a3.5 3.5 0 0 1 0 7H8v6H6V4h2z M8 6v3h5.5a1.5 1.5 0 0 0 0-3H8z" />,
        italic: <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10 4h6l-4 16H6l4-16z" />,
        underline: <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 4v7a4 4 0 1 0 8 0V4M4 20h16" />,
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            {paths[type]}
        </svg>
    )
};

const EditorPanel: React.FC<EditorPanelProps> = ({
  creative, settings, onSettingsChange,
  aspectRatios, activeAspectRatio, onAspectRatioChange,
  onDownload, onBack, previewScale, onScaleChange, onSaveToHistory, onApplyPreset,
  onGenerateAudio, onRemoveAudio
}) => {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const handleApplyPreset = (presetSettings: EditorSettings) => {
    if (window.confirm("Isso substituirá todas as configurações de estilo atuais por este layout predefinido. Deseja continuar?")) {
        onApplyPreset(presetSettings);
    }
  };

  const handleGenerateAudioClick = async () => {
    setIsGeneratingAudio(true);
    await onGenerateAudio();
    setIsGeneratingAudio(false);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-lg sticky top-8 space-y-4">
        <div>
            <Button onClick={onBack} variant="secondary" className="w-full mb-4">
            &larr; Voltar para Variações
            </Button>
            <h2 className="text-xl font-bold font-poppins">Editar Criativo</h2>
        </div>

      {/* Text Content Info */}
      <div className="space-y-2">
        <p className="text-sm text-center bg-gray-200 p-3 rounded-md text-gray-700">
          Clique diretamente no texto na pré-visualização para editar o conteúdo.
        </p>
      </div>
      
      {/* Layout Presets */}
      <details className="space-y-4" open>
        <summary className="text-lg font-semibold font-poppins cursor-pointer list-inside">
          Layouts Predefinidos
        </summary>
        <div className="p-3 bg-white rounded-md mt-2 border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Aplique um estilo completo com um clique.</p>
            <div className="grid grid-cols-1 gap-2">
                {LAYOUT_PRESETS.map(preset => (
                    <Button
                        key={preset.name}
                        variant="secondary"
                        onClick={() => handleApplyPreset(preset.settings)}
                        className="w-full"
                    >
                        {preset.name}
                    </Button>
                ))}
            </div>
        </div>
      </details>
      
      {/* Styling */}
      <details className="space-y-4 pt-4 border-t border-gray-200">
         <summary className="text-lg font-semibold font-poppins cursor-pointer list-inside">
          Ajustes Finos
        </summary>
        <div className="space-y-4 mt-2 p-3 bg-white rounded-md border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fonte</label>
            <select value={settings.fontFamily} onChange={e => onSettingsChange({...settings, fontFamily: e.target.value})} className="w-full p-2 bg-white border border-gray-300 rounded-md">
              {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Estilo da Fonte</label>
              <div className="flex gap-2 mt-1">
                  <button 
                      onClick={() => onSettingsChange({...settings, fontWeight: settings.fontWeight === 'bold' ? 'normal' : 'bold'})} 
                      className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.fontWeight === 'bold' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                      aria-pressed={settings.fontWeight === 'bold'}
                  >
                      <StyleIcon type="bold" />
                  </button>
                  <button 
                      onClick={() => onSettingsChange({...settings, fontStyle: settings.fontStyle === 'italic' ? 'normal' : 'italic'})} 
                      className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.fontStyle === 'italic' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                      aria-pressed={settings.fontStyle === 'italic'}
                  >
                      <StyleIcon type="italic" />
                  </button>
                  <button 
                      onClick={() => onSettingsChange({...settings, textDecoration: settings.textDecoration === 'underline' ? 'none' : 'underline'})} 
                      className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.textDecoration === 'underline' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                      aria-pressed={settings.textDecoration === 'underline'}
                  >
                      <StyleIcon type="underline" />
                  </button>
              </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cor do Texto</label>
            <input type="color" value={settings.textColor} onChange={e => onSettingsChange({...settings, textColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tamanho do Título</label>
                <input type="number" value={settings.titleFontSize} onChange={e => onSettingsChange({...settings, titleFontSize: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tamanho do Subtítulo</label>
                <input type="number" value={settings.subtitleFontSize} onChange={e => onSettingsChange({...settings, subtitleFontSize: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
              </div>
          </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">Espaçamento Título/Subtítulo ({settings.titleSubtitleSpacing}px)</label>
              <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="1" 
                  value={settings.titleSubtitleSpacing} 
                  onChange={e => onSettingsChange({...settings, titleSubtitleSpacing: Number(e.target.value)})} 
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Alinhamento do Texto</label>
              <div className="flex gap-2 mt-1">
                  {(['left', 'center', 'right'] as const).map(align => (
                      <button 
                          key={align} 
                          onClick={() => onSettingsChange({...settings, textAlign: align})} 
                          className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.textAlign === align ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                          aria-label={`Alinhar texto à ${align === 'left' ? 'esquerda' : align === 'center' ? 'centro' : 'direita'}`}
                      >
                          <TextAlignIcon alignment={align} />
                      </button>
                  ))}
              </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Opacidade do Texto ({Math.round(settings.textOpacity * 100)}%)</label>
              <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={settings.textOpacity} 
                  onChange={e => onSettingsChange({...settings, textOpacity: Number(e.target.value)})} 
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
          </div>
          <div>
              <h4 className="text-md font-semibold text-gray-800 mt-4">Contorno do Texto</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Cor</label>
                      <input type="color" value={settings.textStrokeColor} onChange={e => onSettingsChange({...settings, textStrokeColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Largura ({settings.textStrokeWidth}px)</label>
                      <input type="range" min="0" max="10" step="0.5" value={settings.textStrokeWidth} onChange={e => onSettingsChange({...settings, textStrokeWidth: Number(e.target.value)})} className="w-full mt-2 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                  </div>
              </div>
          </div>
          <div>
              <h4 className="text-md font-semibold text-gray-800 mt-4">Sombra / Brilho do Texto</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Cor</label>
                      <input type="color" value={settings.textShadowColor} onChange={e => onSettingsChange({...settings, textShadowColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Opacidade ({Math.round(settings.textShadowOpacity * 100)}%)</label>
                      <input type="range" min="0" max="1" step="0.05" value={settings.textShadowOpacity} onChange={e => onSettingsChange({...settings, textShadowOpacity: Number(e.target.value)})} className="w-full mt-2 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mt-2">Desfoque ({settings.textShadowBlur}px)</label>
                  <input type="range" min="0" max="20" step="1" value={settings.textShadowBlur} onChange={e => onSettingsChange({...settings, textShadowBlur: Number(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
              </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Margem Lateral</label>
                <input type="number" value={settings.paddingX} onChange={e => onSettingsChange({...settings, paddingX: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Margem Vertical</label>
                <input type="number" value={settings.paddingY} onChange={e => onSettingsChange({...settings, paddingY: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
              </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Posição Vertical</label>
              <select value={settings.textPosition} onChange={e => onSettingsChange({...settings, textPosition: e.target.value as 'top' | 'middle' | 'bottom'})} className="w-full p-2 bg-white border border-gray-300 rounded-md">
                  <option value="top">Topo</option>
                  <option value="middle">Meio</option>
                  <option value="bottom">Base</option>
              </select>
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-800 mt-4">Fundo e Contraste</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700 mt-2">Cor da Sobreposição</label>
                <input type="color" value={settings.overlayColor} onChange={e => onSettingsChange({...settings, overlayColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mt-2">Opacidade da Sobreposição ({Math.round(settings.overlayOpacity * 100)}%)</label>
                <input type="range" min="0" max="1" step="0.05" value={settings.overlayOpacity} onChange={e => onSettingsChange({...settings, overlayOpacity: Number(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
            </div>
          </div>
        </div>
      </details>
      
      {/* Audio Generation */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold font-poppins">Narração com IA</h3>
        <div className="mt-2 p-3 bg-white rounded-md border border-gray-200 space-y-3">
          {creative.audioB64 ? (
            <div>
              <audio controls src={`data:audio/mpeg;base64,${creative.audioB64}`} className="w-full"></audio>
              <Button onClick={onRemoveAudio} variant="secondary" className="w-full mt-2 text-sm bg-red-100 text-red-700 hover:bg-red-200">
                Remover Áudio
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateAudioClick} disabled={isGeneratingAudio} className="w-full">
              {isGeneratingAudio ? (
                <span className="flex items-center justify-center">
                  <Loader size="h-5 w-5 mr-2"/> Gerando Áudio...
                </span>
              ) : (
                'Gerar Áudio do Texto'
              )}
            </Button>
          )}
          <p className="text-xs text-gray-500 text-center">A IA usará o título e subtítulo para criar uma narração.</p>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold font-poppins">Formato</h3>
        <div className="flex gap-2 mt-2">
          {aspectRatios.map(ratio => (
            <button key={ratio} onClick={() => onAspectRatioChange(ratio)} className={`flex-1 py-2 text-sm rounded-md transition ${activeAspectRatio === ratio ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}>
              {ratio}
            </button>
          ))}
        </div>
      </div>
      
      {/* Preview Zoom */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold font-poppins">Visualização</h3>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">Zoom do Preview ({Math.round(previewScale * 100)}%)</label>
          <input 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.05" 
            value={previewScale} 
            onChange={e => onScaleChange(Number(e.target.value))} 
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-2">
        <Button onClick={() => onSaveToHistory(creative)} variant="secondary">
          Salvar no Histórico
        </Button>
        <Button onClick={onDownload}>
          Baixar Imagem
        </Button>
      </div>

    </div>
  );
};

export default EditorPanel;