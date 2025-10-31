import React, { useState } from 'react';
import { CarouselSlide, EditorSettings } from '../types';
import Button from './ui/Button';
import { FONT_FACES } from '../constants';

interface CarouselSlideEditorModalProps {
  slide: CarouselSlide;
  onClose: () => void;
  onSave: (slideId: string, newSettings: EditorSettings) => void;
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


const CarouselSlideEditorModal: React.FC<CarouselSlideEditorModalProps> = ({ slide, onClose, onSave }) => {
  const [settings, setSettings] = useState<EditorSettings>(slide.settings);

  const handleSave = () => {
    onSave(slide.id, settings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
        <h3 className="text-xl font-bold font-poppins mb-4 flex-shrink-0">Editar Estilo do Slide</h3>
        
        <div className="space-y-4 overflow-y-auto pr-2 -mr-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fonte</label>
              <select value={settings.fontFamily} onChange={e => setSettings({...settings, fontFamily: e.target.value})} className="w-full p-2 bg-white border border-gray-300 rounded-md">
                {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estilo da Fonte</label>
              <div className="flex gap-2 mt-1">
                  <button 
                      onClick={() => setSettings({...settings, fontWeight: settings.fontWeight === 'bold' ? 'normal' : 'bold'})} 
                      className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.fontWeight === 'bold' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                      aria-pressed={settings.fontWeight === 'bold'}
                  >
                      <StyleIcon type="bold" />
                  </button>
                  <button 
                      onClick={() => setSettings({...settings, fontStyle: settings.fontStyle === 'italic' ? 'normal' : 'italic'})} 
                      className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.fontStyle === 'italic' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                      aria-pressed={settings.fontStyle === 'italic'}
                  >
                      <StyleIcon type="italic" />
                  </button>
                  <button 
                      onClick={() => setSettings({...settings, textDecoration: settings.textDecoration === 'underline' ? 'none' : 'underline'})} 
                      className={`flex-1 py-2 flex justify-center items-center rounded-md transition ${settings.textDecoration === 'underline' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`}
                      aria-pressed={settings.textDecoration === 'underline'}
                  >
                      <StyleIcon type="underline" />
                  </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cor do Texto</label>
              <input type="color" value={settings.textColor} onChange={e => setSettings({...settings, textColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tamanho do Título</label>
                  <input type="number" value={settings.titleFontSize} onChange={e => setSettings({...settings, titleFontSize: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tamanho do Subtítulo</label>
                  <input type="number" value={settings.subtitleFontSize} onChange={e => setSettings({...settings, subtitleFontSize: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
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
                  onChange={e => setSettings({...settings, titleSubtitleSpacing: Number(e.target.value)})} 
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Alinhamento do Texto</label>
                <div className="flex gap-2 mt-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                        <button 
                            key={align} 
                            onClick={() => setSettings({...settings, textAlign: align})} 
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
                    onChange={e => setSettings({...settings, textOpacity: Number(e.target.value)})} 
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                />
            </div>
            <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-800">Contorno do Texto</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cor</label>
                        <input type="color" value={settings.textStrokeColor} onChange={e => setSettings({...settings, textStrokeColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Largura ({settings.textStrokeWidth}px)</label>
                        <input type="range" min="0" max="10" step="0.5" value={settings.textStrokeWidth} onChange={e => setSettings({...settings, textStrokeWidth: Number(e.target.value)})} className="w-full mt-2 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                    </div>
                </div>
            </div>
             <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-800">Sombra / Brilho do Texto</h4>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cor</label>
                        <input type="color" value={settings.textShadowColor} onChange={e => setSettings({...settings, textShadowColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Opacidade ({Math.round(settings.textShadowOpacity * 100)}%)</label>
                        <input type="range" min="0" max="1" step="0.05" value={settings.textShadowOpacity} onChange={e => setSettings({...settings, textShadowOpacity: Number(e.target.value)})} className="w-full mt-2 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mt-2">Desfoque ({settings.textShadowBlur}px)</label>
                    <input type="range" min="0" max="20" step="1" value={settings.textShadowBlur} onChange={e => setSettings({...settings, textShadowBlur: Number(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-800">Fundo e Contraste</h4>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mt-2">Cor da Sobreposição</label>
                    <input type="color" value={settings.overlayColor} onChange={e => setSettings({...settings, overlayColor: e.target.value})} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mt-2">Opacidade da Sobreposição ({Math.round(settings.overlayOpacity * 100)}%)</label>
                    <input type="range" min="0" max="1" step="0.05" value={settings.overlayOpacity} onChange={e => setSettings({...settings, overlayOpacity: Number(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margem Lateral</label>
                  <input type="number" value={settings.paddingX} onChange={e => setSettings({...settings, paddingX: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margem Vertical</label>
                  <input type="number" value={settings.paddingY} onChange={e => setSettings({...settings, paddingY: Number(e.target.value)})} className="w-full p-2 bg-white border border-gray-300 rounded-md"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Posição Vertical</label>
                <select value={settings.textPosition} onChange={e => setSettings({...settings, textPosition: e.target.value as 'top' | 'middle' | 'bottom'})} className="w-full p-2 bg-white border border-gray-300 rounded-md">
                    <option value="top">Topo</option>
                    <option value="middle">Meio</option>
                    <option value="bottom">Base</option>
                </select>
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-6 flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Estilo</Button>
        </div>
      </div>
    </div>
  );
};

export default CarouselSlideEditorModal;