import React, { useState, useRef } from 'react';
import { CarouselCreative, CarouselSlide, EditorSettings, GlobalStyleSettings } from '../types';
import Button from './ui/Button';
import { generateAlternativeHooks, generateAlternativeCaptions } from '../services/geminiService';
import Loader from './ui/Loader';
import CarouselSlideEditorModal from './CarouselSlideEditorModal';
import { FONT_FACES, INITIAL_EDITOR_SETTINGS, LAYOUT_PRESETS } from '../constants';

interface CarouselEditorPanelProps {
  carousel: CarouselCreative;
  onSlideSettingsChange: (slideId: string, newSettings: EditorSettings) => void;
  onCaptionChange: (newCaption: string) => void;
  onRegenerateImage: (slideId: string, newPrompt: string) => Promise<void>;
  onDownloadSlides: () => void;
  onBack: () => void;
  promptContext: string;
  onSaveToHistory: (carousel: CarouselCreative) => void;
  onApplyGlobalStyles: (styles: GlobalStyleSettings) => void;
  onApplyLayoutPreset: (settings: EditorSettings) => void;
  onReorderSlides: (dragIndex: number, hoverIndex: number) => void;
  onAddSlide: () => void;
  onDownloadSingleSlide: (slideId: string) => void;
}

const StyleIcon: React.FC<{ type: 'bold' | 'italic' | 'underline' }> = ({ type }) => {
    const paths = {
        bold: <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 4h5.5a3.5 3.5 0 0 1 0 7H8v6H6V4h2z M8 6v3h5.5a1.5 1.5 0 0 0 0-3H8z" />,
        italic: <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10 4h6l-4 16H6l4-16z" />,
        underline: <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 4v7a4 4 0 1 0 8 0V4M4 20h16" />,
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            {paths[type]}
        </svg>
    )
};

const CarouselEditorPanel: React.FC<CarouselEditorPanelProps> = ({ 
  carousel, 
  onSlideSettingsChange,
  onCaptionChange,
  onRegenerateImage,
  onDownloadSlides,
  onBack, 
  promptContext, 
  onSaveToHistory,
  onApplyGlobalStyles,
  onApplyLayoutPreset,
  onReorderSlides,
  onAddSlide,
  onDownloadSingleSlide
}) => {
  const [hookSuggestions, setHookSuggestions] = useState<string[]>([]);
  const [isSuggestingHooks, setIsSuggestingHooks] = useState(false);
  const [hookSuggestionError, setHookSuggestionError] = useState('');

  const [captionSuggestions, setCaptionSuggestions] = useState<string[]>([]);
  const [isSuggestingCaptions, setIsSuggestingCaptions] = useState(false);
  const [captionSuggestionError, setCaptionSuggestionError] = useState('');

  const [editingImageSlide, setEditingImageSlide] = useState<CarouselSlide | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  
  const [editingStyleSlide, setEditingStyleSlide] = useState<CarouselSlide | null>(null);

  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  const [appliedMessage, setAppliedMessage] = useState('');

  const [globalSettings, setGlobalSettings] = useState<GlobalStyleSettings>(() => {
    const firstSlideSettings = carousel.slides[0]?.settings;
    return {
        fontFamily: firstSlideSettings?.fontFamily || INITIAL_EDITOR_SETTINGS.fontFamily,
        textColor: firstSlideSettings?.textColor || INITIAL_EDITOR_SETTINGS.textColor,
        titleFontSize: firstSlideSettings?.titleFontSize || INITIAL_EDITOR_SETTINGS.titleFontSize,
        subtitleFontSize: firstSlideSettings?.subtitleFontSize || INITIAL_EDITOR_SETTINGS.subtitleFontSize,
        overlayColor: firstSlideSettings?.overlayColor || INITIAL_EDITOR_SETTINGS.overlayColor,
        overlayOpacity: firstSlideSettings?.overlayOpacity || INITIAL_EDITOR_SETTINGS.overlayOpacity,
        textShadowColor: firstSlideSettings?.textShadowColor || INITIAL_EDITOR_SETTINGS.textShadowColor,
        textShadowBlur: firstSlideSettings?.textShadowBlur || INITIAL_EDITOR_SETTINGS.textShadowBlur,
        textShadowOpacity: firstSlideSettings?.textShadowOpacity || INITIAL_EDITOR_SETTINGS.textShadowOpacity,
        fontWeight: firstSlideSettings?.fontWeight || INITIAL_EDITOR_SETTINGS.fontWeight,
        fontStyle: firstSlideSettings?.fontStyle || INITIAL_EDITOR_SETTINGS.fontStyle,
        textDecoration: firstSlideSettings?.textDecoration || INITIAL_EDITOR_SETTINGS.textDecoration,
        textStrokeWidth: firstSlideSettings?.textStrokeWidth ?? INITIAL_EDITOR_SETTINGS.textStrokeWidth,
        textStrokeColor: firstSlideSettings?.textStrokeColor || INITIAL_EDITOR_SETTINGS.textStrokeColor,
        titleSubtitleSpacing: firstSlideSettings?.titleSubtitleSpacing || INITIAL_EDITOR_SETTINGS.titleSubtitleSpacing,
    };
  });

  const handleGlobalSettingsChange = <K extends keyof GlobalStyleSettings>(
    field: K,
    value: GlobalStyleSettings[K]
  ) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyGlobalStyles = () => {
    if (window.confirm("Isso substituirá as configurações de fonte, cor, tamanho, sombra e fundo de todos os slides. Deseja continuar?")) {
        onApplyGlobalStyles(globalSettings);
        setAppliedMessage('Estilos globais aplicados com sucesso!');
        setTimeout(() => setAppliedMessage(''), 3000);
    }
  };

  const handleApplyPreset = (settings: EditorSettings) => {
    if (window.confirm("Isso substituirá todas as configurações de estilo dos slides por este layout predefinido. Deseja continuar?")) {
        onApplyLayoutPreset(settings);
    }
  };


  const handleSuggestHooks = async () => {
    setIsSuggestingHooks(true);
    setHookSuggestionError('');
    setHookSuggestions([]);
    try {
      const hooks = await generateAlternativeHooks(promptContext);
      setHookSuggestions(hooks);
    } catch (error) {
      console.error(error);
      setHookSuggestionError('Falha ao gerar sugestões de ganchos.');
    } finally {
      setIsSuggestingHooks(false);
    }
  };

  const handleSuggestCaptions = async () => {
    setIsSuggestingCaptions(true);
    setCaptionSuggestionError('');
    setCaptionSuggestions([]);
    try {
      const captions = await generateAlternativeCaptions(promptContext);
      setCaptionSuggestions(captions);
    } catch (error) {
      console.error(error);
      setCaptionSuggestionError('Falha ao gerar sugestões de legendas.');
    } finally {
      setIsSuggestingCaptions(false);
    }
  };


  const handleEditImageClick = (slide: CarouselSlide) => {
    setEditingImageSlide(slide);
    setNewPrompt(slide.imagePrompt);
  };

  const handleSaveNewPrompt = async () => {
    if (!editingImageSlide || !newPrompt.trim()) return;
    
    await onRegenerateImage(editingImageSlide.id, newPrompt);
    setEditingImageSlide(null);
  };

  const handleSaveSlideStyle = (slideId: string, newSettings: EditorSettings) => {
    onSlideSettingsChange(slideId, newSettings);
    setEditingStyleSlide(null);
  }

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = () => {
    if (dragItemIndex.current !== null && dragOverItemIndex.current !== null && dragItemIndex.current !== dragOverItemIndex.current) {
        onReorderSlides(dragItemIndex.current, dragOverItemIndex.current);
    }
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };


  return (
    <>
      <div className="p-4 bg-gray-50 rounded-lg shadow-lg sticky top-8 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0">
          <Button onClick={onBack} variant="secondary" className="w-full mb-4">
            &larr; Voltar
          </Button>
          <h2 className="text-xl font-bold font-poppins">Editar Carrossel</h2>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pr-2 -mr-2 mt-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Legenda Principal</label>
              <textarea
                value={carousel.caption}
                onChange={(e) => onCaptionChange(e.target.value)}
                className="w-full h-28 p-2 bg-white border border-gray-300 rounded-md text-sm"
              />
              <Button variant="secondary" onClick={handleSuggestCaptions} disabled={isSuggestingCaptions} className="text-sm py-1.5 px-3 w-full">
                  {isSuggestingCaptions ? (
                      <div className="flex items-center justify-center"><Loader size="h-4 w-4" /><span className="ml-2">Sugerindo...</span></div>
                  ) : 'Sugerir Legendas Alternativas'}
              </Button>
              {captionSuggestionError && <p className="text-red-500 text-xs mt-1">{captionSuggestionError}</p>}
              {captionSuggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                      {captionSuggestions.map((caption, i) => (
                          <button
                              key={i}
                              onClick={() => { onCaptionChange(caption); setCaptionSuggestions([]); }}
                              className="w-full text-left text-xs p-2 bg-gray-100 hover:bg-brand-gold hover:text-white rounded-md transition"
                          >"{caption}"</button>
                      ))}
                  </div>
              )}
            </div>
            
            <details className="pt-4 border-t border-gray-200" open>
                <summary className="text-lg font-semibold font-poppins cursor-pointer list-inside">
                  Layouts Predefinidos
                </summary>
                <div className="p-3 bg-white rounded-md mt-2 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">Aplique um estilo completo a todos os slides com um clique.</p>
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

            <details className="pt-4 border-t border-gray-200">
                <summary className="text-lg font-semibold font-poppins cursor-pointer list-inside">
                  Ajustes Finos Globais
                </summary>
                <div className="space-y-3 p-3 bg-white rounded-md mt-2 border border-gray-200">
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Fonte</label>
                        <select
                            value={globalSettings.fontFamily}
                            onChange={e => handleGlobalSettingsChange('fontFamily', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm"
                        >
                            {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Estilo da Fonte</label>
                      <div className="flex gap-2 mt-1">
                          <button onClick={() => handleGlobalSettingsChange('fontWeight', globalSettings.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 py-1.5 flex justify-center items-center rounded-md transition ${globalSettings.fontWeight === 'bold' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`} aria-pressed={globalSettings.fontWeight === 'bold'}><StyleIcon type="bold" /></button>
                          <button onClick={() => handleGlobalSettingsChange('fontStyle', globalSettings.fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex-1 py-1.5 flex justify-center items-center rounded-md transition ${globalSettings.fontStyle === 'italic' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`} aria-pressed={globalSettings.fontStyle === 'italic'}><StyleIcon type="italic" /></button>
                          <button onClick={() => handleGlobalSettingsChange('textDecoration', globalSettings.textDecoration === 'underline' ? 'none' : 'underline')} className={`flex-1 py-1.5 flex justify-center items-center rounded-md transition ${globalSettings.textDecoration === 'underline' ? 'bg-brand-gold text-white' : 'bg-gray-200 text-brand-gray hover:bg-gray-300'}`} aria-pressed={globalSettings.textDecoration === 'underline'}><StyleIcon type="underline" /></button>
                      </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Cor do Texto</label>
                        <input
                            type="color"
                            value={globalSettings.textColor}
                            onChange={e => handleGlobalSettingsChange('textColor', e.target.value)}
                            className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Tamanho Título</label>
                            <input
                                type="number"
                                value={globalSettings.titleFontSize}
                                onChange={e => handleGlobalSettingsChange('titleFontSize', Number(e.target.value))}
                                className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Tamanho Subtítulo</label>
                            <input
                                type="number"
                                value={globalSettings.subtitleFontSize}
                                onChange={e => handleGlobalSettingsChange('subtitleFontSize', Number(e.target.value))}
                                className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700">Espaçamento Título/Subtítulo ({globalSettings.titleSubtitleSpacing}px)</label>
                        <input type="range" min="0" max="100" step="1" value={globalSettings.titleSubtitleSpacing} onChange={e => handleGlobalSettingsChange('titleSubtitleSpacing', Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                    </div>
                    <div className="pt-3 border-t">
                        <label className="block text-xs font-medium text-gray-700">Contorno do Texto</label>
                        <div className="flex items-center gap-2 mt-1">
                           <input type="color" value={globalSettings.textStrokeColor} onChange={e => handleGlobalSettingsChange('textStrokeColor', e.target.value)} className="w-1/3 h-8 p-1 bg-white border border-gray-300 rounded-md"/>
                           <div className="w-2/3">
                            <input type="range" min="0" max="10" step="0.5" value={globalSettings.textStrokeWidth} onChange={e => handleGlobalSettingsChange('textStrokeWidth', Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                           </div>
                        </div>
                    </div>
                     <div className="pt-3 border-t">
                        <label className="block text-xs font-medium text-gray-700">Sobreposição de Fundo</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={globalSettings.overlayColor} onChange={e => handleGlobalSettingsChange('overlayColor', e.target.value)} className="w-1/3 h-8 p-1 bg-white border border-gray-300 rounded-md"/>
                            <input type="range" min="0" max="1" step="0.05" value={globalSettings.overlayOpacity} onChange={e => handleGlobalSettingsChange('overlayOpacity', Number(e.target.value))} className="w-2/3 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                        </div>
                    </div>
                     <div className="pt-3 border-t">
                        <label className="block text-xs font-medium text-gray-700">Sombra / Brilho do Texto</label>
                         <div className="flex items-center gap-2 mt-1">
                             <input type="color" value={globalSettings.textShadowColor} onChange={e => handleGlobalSettingsChange('textShadowColor', e.target.value)} className="w-1/3 h-8 p-1 bg-white border border-gray-300 rounded-md"/>
                             <input type="range" min="0" max="1" step="0.05" value={globalSettings.textShadowOpacity} onChange={e => handleGlobalSettingsChange('textShadowOpacity', Number(e.target.value))} className="w-2/3 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                        </div>
                         <label className="block text-xs font-medium text-gray-700 mt-1">Desfoque da Sombra</label>
                         <input type="range" min="0" max="20" step="1" value={globalSettings.textShadowBlur} onChange={e => handleGlobalSettingsChange('textShadowBlur', Number(e.target.value))} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-gold"/>
                    </div>
                    <Button onClick={handleApplyGlobalStyles} className="w-full text-sm py-2 mt-2">
                        Aplicar a Todos os Slides
                    </Button>
                    {appliedMessage && <p className="text-sm text-brand-green text-center mt-2 animate-fade-in">{appliedMessage}</p>}
                </div>
            </details>


            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold font-poppins">Slides</h3>
               <p className="text-sm text-center bg-gray-200 p-3 rounded-md text-gray-700">
                  Clique no texto na pré-visualização principal à direita para editar o conteúdo de cada slide.
                </p>
              {carousel.slides.map((slide, index) => (
                <div 
                    key={slide.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="p-3 bg-white rounded-md border border-gray-200 transition-shadow duration-200 hover:shadow-md"
                >
                    <div className="flex items-start gap-2">
                        <div className="cursor-grab active:cursor-grabbing text-gray-400 pt-1" aria-label="Arraste para reordenar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-5 h-5" viewBox="0 0 16 16">
                                <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                            </svg>
                        </div>
                        <div className="flex-grow">
                            <p className="block text-sm font-medium text-gray-700 mb-2">Slide {index + 1}</p>
                            
                            <div className="mt-2 flex items-center gap-2">
                                <div className="relative w-12 h-12 flex-shrink-0">
                                    <img src={slide.imageUrl} alt={`Slide ${index + 1}`} className="w-full h-full rounded object-cover" />
                                    {(slide.isGenerating || slide.isDownloading) && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                                        <Loader size="h-5 w-5" />
                                    </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 italic truncate">Prompt: {slide.imagePrompt}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <button onClick={() => handleEditImageClick(slide)} className="text-xs text-brand-gold hover:underline font-semibold disabled:opacity-50" disabled={slide.isGenerating || slide.isDownloading}>Editar Imagem</button>
                                        <button onClick={() => setEditingStyleSlide(slide)} className="text-xs text-brand-gold hover:underline font-semibold disabled:opacity-50" disabled={slide.isGenerating || slide.isDownloading}>Editar Estilo</button>
                                        <button 
                                          onClick={() => onDownloadSingleSlide(slide.id)}
                                          className="text-xs text-brand-gold hover:underline font-semibold flex items-center disabled:opacity-50" 
                                          disabled={slide.isGenerating || slide.isDownloading}
                                        >
                                          {slide.isDownloading ? 'Baixando...' : 'Baixar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
              <div className="mt-2">
                <Button
                    variant="secondary"
                    onClick={onAddSlide}
                    className="w-full text-sm flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Novo Slide
                </Button>
              </div>
            </div>
        </div>
        <div className="pt-4 mt-4 border-t border-gray-200 flex-shrink-0 grid grid-cols-2 gap-2">
            <Button onClick={onDownloadSlides} variant="secondary">Baixar Slides</Button>
            <Button onClick={() => onSaveToHistory(carousel)}>Salvar Carrossel</Button>
        </div>
      </div>

      {editingImageSlide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-bold font-poppins mb-4">Editar Prompt da Imagem</h3>
                <p className="text-sm text-gray-500 mb-2">Slide {carousel.slides.findIndex(s => s.id === editingImageSlide.id) + 1}</p>
                <textarea
                    value={newPrompt}
                    onChange={e => setNewPrompt(e.target.value)}
                    className="w-full h-32 p-2 bg-white border border-gray-300 rounded-md text-sm"
                    rows={5}
                />
                <div className="flex justify-end gap-4 mt-4">
                    <Button variant="secondary" onClick={() => setEditingImageSlide(null)}>Cancelar</Button>
                    <Button onClick={handleSaveNewPrompt}>Salvar e Regenerar</Button>
                </div>
            </div>
        </div>
      )}

      {editingStyleSlide && (
          <CarouselSlideEditorModal 
              slide={editingStyleSlide}
              onClose={() => setEditingStyleSlide(null)}
              onSave={handleSaveSlideStyle}
          />
      )}
    </>
  );
};

export default CarouselEditorPanel;