
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AdCreative, AspectRatio, EditorSettings, GenerationMode, CarouselCreative, CarouselSlide, HistoryItem, AdCopyVariation, GlobalStyleSettings } from './types';
import { ASPECT_RATIOS, INITIAL_EDITOR_SETTINGS, INITIAL_CAROUSEL_SLIDE_SETTINGS } from './constants';
import { generateAdStrategyAndCopy, generateImage, recreateExpertImage, generateCarouselPlan, generateSpeech, ApiKeyError, transcribeAudio, extractTextFromFile, setApiKey as setGeminiApiKey } from './services/geminiService';
import CreativeControls from './components/CreativeControls';
import GeneratedVariations from './components/GeneratedVariations';
import EditorPanel from './components/EditorPanel';
import AdPreview from './components/AdPreview';
import Loader from './components/ui/Loader';
import { toPng } from 'html-to-image';
import { blobToBase64 } from './utils/fileUtils';
import HistoryPanel from './components/HistoryPanel';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import CarouselPreview from './components/CarouselPreview';
import CarouselEditorPanel from './components/CarouselEditorPanel';
import ProjectInput from './components/ProjectInput';

const App: React.FC = () => {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  
  // State for the API key input form
  const [tempApiKey, setTempApiKey] = useState('');
  const [rememberApiKey, setRememberApiKey] = useState(false);

  const [appStep, setAppStep] = useState<'input' | 'generate'>('input');
  const [promptContext, setPromptContext] = useState<string>('');
  
  const [generatedCreatives, setGeneratedCreatives] = useState<AdCreative[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselCreative | null>(null);
  const [expertImageB64, setExpertImageB64] = useState<{ data: string; mimeType: string; } | null>(null);

  const [activeAspectRatio, setActiveAspectRatio] = useState<AspectRatio>('1:1');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [editorSettings, setEditorSettings] = useState<EditorSettings>(INITIAL_EDITOR_SETTINGS);
  const [previewScale, setPreviewScale] = useState<number>(1);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState<boolean>(false);

  const adPreviewRef = useRef<HTMLDivElement>(null);
  const offscreenRenderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verificar se há uma chave nas variáveis de ambiente primeiro
    // A chave será embutida no código durante o build pelo Vite
    // @ts-ignore - Vite define essas variáveis via define no vite.config.ts
    let envKey: string | null = null;
    
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      const key = process.env.GEMINI_API_KEY;
      if (key && typeof key === 'string' && key.trim() && key !== 'coloque_sua_chave_aqui' && key.length >= 20) {
        envKey = key.trim();
      }
    }
    
    if (!envKey && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      const key = import.meta.env.VITE_GEMINI_API_KEY;
      if (key && typeof key === 'string' && key.trim() && key !== 'coloque_sua_chave_aqui' && key.length >= 20) {
        envKey = key.trim();
      }
    }
    
    if (envKey) {
        // Chave definida no ambiente - usar automaticamente
        try {
          setGeminiApiKey(envKey);
          setIsApiKeySet(true);
          setIsCheckingApiKey(false);
          return;
        } catch (error) {
          console.error('[APP] Erro ao configurar chave do ambiente:', error);
          // Continuar para verificar localStorage
        }
    }
    
    // Se não houver chave no ambiente válida, verificar localStorage/sessionStorage
    const storedKey = sessionStorage.getItem('geminiApiKey') || localStorage.getItem('geminiApiKey');
    if (storedKey && storedKey.trim() && storedKey.length >= 20) {
        try {
          setGeminiApiKey(storedKey);
          setIsApiKeySet(true);
        } catch (error) {
          console.error('[APP] Erro ao configurar chave armazenada:', error);
          // Limpar chave inválida
          sessionStorage.removeItem('geminiApiKey');
          localStorage.removeItem('geminiApiKey');
        }
    }
    setIsCheckingApiKey(false);
  }, []);


  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('adCreativeHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Falha ao carregar o histórico do localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('adCreativeHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Falha ao salvar o histórico no localStorage", error);
    }
  }, [history]);
  
  const handleApiKeyError = (error: unknown) => {
    if (error instanceof ApiKeyError) {
        setGeminiApiKey('');
        setIsApiKeySet(false);
        sessionStorage.removeItem('geminiApiKey');
        localStorage.removeItem('geminiApiKey');
        setErrorMessage(error.message || 'Ocorreu um erro com a chave de API. Por favor, insira uma chave válida.');
        return true;
    }
    return false;
  };

  const handleApiKeySubmit = async (key: string, remember: boolean) => {
    const trimmedKey = key.trim();
    
    // Validação básica
    if (!trimmedKey || trimmedKey.length < 20) {
      setErrorMessage('A chave de API parece inválida. Verifique se copiou a chave completa.');
      return;
    }
    
    // Limpar erros anteriores
    setErrorMessage('');
    
    try {
      // Configurar a chave
      setGeminiApiKey(trimmedKey);
      
      // Salvar a chave
      sessionStorage.setItem('geminiApiKey', trimmedKey);
      if (remember) {
          localStorage.setItem('geminiApiKey', trimmedKey);
      } else {
          localStorage.removeItem('geminiApiKey');
      }
      
      setIsApiKeySet(true);
    } catch (error) {
      console.error('Erro ao configurar chave de API:', error);
      setErrorMessage('Erro ao configurar a chave de API. Por favor, tente novamente.');
      setIsApiKeySet(false);
    }
  };

  const handleProjectSubmit = (context: string) => {
    setPromptContext(context);
    setAppStep('generate');
  };

  const handleReset = () => {
    if (window.confirm("Tem certeza que deseja começar um novo projeto? O conteúdo gerado atual será perdido (a menos que esteja salvo no histórico).")) {
      setAppStep('input');
      setPromptContext('');
      setGeneratedCreatives([]);
      setSelectedCreative(null);
      setSelectedCarousel(null);
      setExpertImageB64(null);
      setErrorMessage('');
      setIsViewingHistory(false);
    }
  };

  const handleGenerate = useCallback(async (backgroundPrompt: string, expertImageFile: File | null, generationMode: GenerationMode) => {
    if (!promptContext.trim()) {
        alert("Por favor, forneça o contexto do projeto ou a estratégia do anúncio.");
        return;
    }
      
    setIsLoading(true);
    setErrorMessage('');
    setGeneratedCreatives([]);
    setSelectedCreative(null);
    setSelectedCarousel(null);
    setIsViewingHistory(false);

    try {
      if (generationMode === 'carousel') {
          const expertImageInfo = expertImageFile ? await blobToBase64(expertImageFile) : null;
          if(expertImageInfo) setExpertImageB64(expertImageInfo);

          setLoadingMessage('Passo 1/3: Roteirizando seu carrossel...');
          const plan = await generateCarouselPlan(promptContext, backgroundPrompt, !!expertImageInfo);
          
          setLoadingMessage(`Passo 2/3: Gerando ${plan.slides.length} imagens para os slides...`);
          
          const imageGenerationPromises = plan.slides.map(slidePlan => {
              if (expertImageInfo) {
                  return recreateExpertImage(expertImageInfo.data, expertImageInfo.mimeType, slidePlan.image_prompt, '4:5');
              }
              return generateImage(slidePlan.image_prompt, "4:5");
          });

          const imagesB64 = await Promise.all(imageGenerationPromises);

          const newSlides: CarouselSlide[] = plan.slides.map((slidePlan, index) => ({
              id: `slide-${Date.now()}-${index}`,
              title: slidePlan.title,
              subtitle: slidePlan.subtitle,
              imagePrompt: slidePlan.image_prompt,
              imageUrl: `data:image/png;base64,${imagesB64[index]}`,
              settings: INITIAL_CAROUSEL_SLIDE_SETTINGS,
          }));

          const newCarousel: CarouselCreative = {
              id: `carousel-${Date.now()}`,
              caption: plan.caption,
              slides: newSlides
          };

          setLoadingMessage('Passo 3/3: Montando seu carrossel...');
          setSelectedCarousel(newCarousel);

      } else { // 'single' mode
          setLoadingMessage('Passo 1/3: Criando a copy e a estratégia do anúncio...');
          const copyVariations: AdCopyVariation[] = await generateAdStrategyAndCopy(promptContext);
    
          const expertImageInfo = expertImageFile ? await blobToBase64(expertImageFile) : null;
          if(expertImageInfo) setExpertImageB64(expertImageInfo);
          
          const creatives: AdCreative[] = [];
          for (let i = 0; i < copyVariations.length; i++) {
            const variation = copyVariations[i];
            setLoadingMessage(`Passo 2/3: Gerando imagem para a variação ${i + 1}/${copyVariations.length}...`);
            
            let imageB64: string;
            const finalPrompt = `${backgroundPrompt}. ${variation.backgroundPrompt}`;
    
            if (expertImageInfo) {
              imageB64 = await recreateExpertImage(expertImageInfo.data, expertImageInfo.mimeType, finalPrompt, '1:1');
            } else {
              imageB64 = await generateImage(finalPrompt, "1:1");
            }
            
            creatives.push({
              id: `creative-${Date.now()}-${i}`,
              ...variation,
              imageUrl: `data:image/png;base64,${imageB64}`,
              caption: variation.caption,
              settings: INITIAL_EDITOR_SETTINGS,
            });
          }
    
          setLoadingMessage('Passo 3/3: Montando seus criativos...');
          setGeneratedCreatives(creatives);
          if (creatives.length > 0) {
            handleSelectCreative(creatives[0]);
          }
      }
    } catch (error) {
        if (!handleApiKeyError(error)) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro durante a geração. Por favor, tente novamente.');
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [promptContext]);
  
  const handleSelectCreative = (creative: AdCreative) => {
    setSelectedCreative(creative);
    setSelectedCarousel(null);
    setEditorSettings(creative.settings || INITIAL_EDITOR_SETTINGS);
  };

  const imageFilter = (node: HTMLElement) => !node.classList?.contains('rich-text-toolbar');

  // Função auxiliar para aguardar o carregamento da imagem
  const waitForImageLoad = (imageUrl: string, timeout: number = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!imageUrl) {
        resolve();
        return;
      }

      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout ao carregar imagem'));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        // Aguardar um pouco mais para garantir que o CSS backgroundImage foi aplicado
        setTimeout(() => resolve(), 100);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        // Mesmo se houver erro, continuar (pode ser CORS ou outro problema)
        console.warn('Aviso: Não foi possível verificar o carregamento da imagem:', imageUrl);
        setTimeout(() => resolve(), 200);
      };

      img.src = imageUrl;
    });
  };

  const handleDownload = useCallback(() => {
    if (!adPreviewRef.current) return;
    toPng(adPreviewRef.current, { cacheBust: true, pixelRatio: 2 / previewScale, filter: imageFilter })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `criativo-anuncio-${selectedCreative?.id}-${activeAspectRatio}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Falha ao baixar a imagem', err);
        setErrorMessage('Não foi possível baixar a imagem. Por favor, tente novamente.');
      });
  }, [adPreviewRef, selectedCreative, activeAspectRatio, previewScale]);

    const handleDownloadCarouselSlides = useCallback(async () => {
    if (!selectedCarousel || !offscreenRenderRef.current) return;

    setLoadingMessage('Preparando slides para download...');
    setIsLoading(true);

    const container = offscreenRenderRef.current;

    for (let i = 0; i < selectedCarousel.slides.length; i++) {
      const slide = selectedCarousel.slides[i];
      setLoadingMessage(`Renderizando slide ${i + 1}/${selectedCarousel.slides.length}...`);

      const tempNode = document.createElement('div');
      container.appendChild(tempNode);

      const element = (
        <AdPreview
          creative={{
            id: slide.id,
            title: slide.title,
            subtitle: slide.subtitle,
            imageUrl: slide.imageUrl,
            caption: '', body: '', backgroundPrompt: ''
          }}
          aspectRatio="4:5"
          settings={slide.settings}
        />
      );
      
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempNode);
      root.render(element);

      // Aguardar renderização inicial
      await new Promise(resolve => setTimeout(resolve, 150));
      
      try {
        // Aguardar carregamento da imagem antes de fazer o download
        setLoadingMessage(`Aguardando carregamento do slide ${i + 1}/${selectedCarousel.slides.length}...`);
        await waitForImageLoad(slide.imageUrl, 15000);
        
        // Aguardar um pouco mais para garantir que tudo está renderizado
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setLoadingMessage(`Baixando slide ${i + 1}/${selectedCarousel.slides.length}...`);
        const slideElement = tempNode.firstChild as HTMLElement;
        
        if (!slideElement) {
          throw new Error('Elemento do slide não encontrado');
        }
        
        const dataUrl = await toPng(slideElement, { 
          cacheBust: true, 
          pixelRatio: 2, 
          filter: imageFilter,
          backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Falha ao baixar o slide ${i + 1}`, err);
        setErrorMessage(`Não foi possível baixar o slide ${i + 1}. ${err instanceof Error ? err.message : ''}`);
        // Não continuar o download se houver erro crítico
        continue;
      } finally {
          root.unmount();
          container.removeChild(tempNode);
      }
    }

    setIsLoading(false);
    setLoadingMessage('');
  }, [selectedCarousel]);

  const handleDownloadSingleSlide = useCallback(async (slideId: string) => {
    if (!selectedCarousel || !offscreenRenderRef.current) return;

    const slideToDownload = selectedCarousel.slides.find(s => s.id === slideId);
    if (!slideToDownload) return;
    
    setSelectedCarousel(prev => {
      if (!prev) return null;
      return {
        ...prev,
        slides: prev.slides.map(s => s.id === slideId ? { ...s, isDownloading: true } : s)
      };
    });

    const container = offscreenRenderRef.current;
    const tempNode = document.createElement('div');
    container.appendChild(tempNode);

    const element = (
      <AdPreview
        creative={{
          id: slideToDownload.id,
          title: slideToDownload.title,
          subtitle: slideToDownload.subtitle,
          imageUrl: slideToDownload.imageUrl,
          caption: '', body: '', backgroundPrompt: ''
        }}
        aspectRatio="4:5"
        settings={slideToDownload.settings}
      />
    );
    
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(tempNode);
    root.render(element);

    // Aguardar renderização inicial
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      // Aguardar carregamento da imagem antes de fazer o download
      await waitForImageLoad(slideToDownload.imageUrl, 15000);
      
      // Aguardar um pouco mais para garantir que tudo está renderizado
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const slideElement = tempNode.firstChild as HTMLElement;
      
      if (!slideElement) {
        throw new Error('Elemento do slide não encontrado');
      }
      
      const dataUrl = await toPng(slideElement, { 
        cacheBust: true, 
        pixelRatio: 2, 
        filter: imageFilter,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      const slideIndex = selectedCarousel.slides.findIndex(s => s.id === slideId);
      link.download = `slide-${slideIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(`Falha ao baixar o slide`, err);
      setErrorMessage(`Não foi possível baixar o slide. ${err instanceof Error ? err.message : ''}`);
    } finally {
      root.unmount();
      container.removeChild(tempNode);
      setSelectedCarousel(prev => {
        if (!prev) return null;
        return {
          ...prev,
          slides: prev.slides.map(s => s.id === slideId ? { ...s, isDownloading: false } : s)
        };
      });
    }
  }, [selectedCarousel]);


  const updateSelectedCreativeText = (field: 'title' | 'subtitle' | 'body', value: string) => {
    if (selectedCreative) {
      const updatedCreative = { ...selectedCreative, [field]: value };
      setSelectedCreative(updatedCreative);
      setGeneratedCreatives(prev => prev.map(c => c.id === updatedCreative.id ? updatedCreative : c));
    }
  };

  const handleGenerateAudio = async () => {
    if (!selectedCreative) return;

    try {
      const textToSpeak = `${selectedCreative.title}. ${selectedCreative.subtitle}`;
      const audioB64 = await generateSpeech(textToSpeak);
      
      const updatedCreative = { ...selectedCreative, audioB64: audioB64 };
      setSelectedCreative(updatedCreative);
      setGeneratedCreatives(prev => prev.map(c => c.id === updatedCreative.id ? updatedCreative : c));

    } catch (error) {
       if (!handleApiKeyError(error)) {
        console.error("Falha ao gerar o áudio", error);
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível gerar a narração.");
       }
    }
  };

  const handleRemoveAudio = () => {
    if (selectedCreative) {
      const { audioB64, ...rest } = selectedCreative;
      const updatedCreative = rest;
      setSelectedCreative(updatedCreative);
      setGeneratedCreatives(prev => prev.map(c => c.id === updatedCreative.id ? updatedCreative : c));
    }
  };

  const updateSelectedCarouselSlideText = useCallback((slideId: string, field: 'title' | 'subtitle', newText: string) => {
    setSelectedCarousel(prevCarousel => {
      if (!prevCarousel) return null;
      const updatedSlides = prevCarousel.slides.map(slide =>
        slide.id === slideId ? { ...slide, [field]: newText } : slide
      );
      return { ...prevCarousel, slides: updatedSlides };
    });
  }, []);

  const updateSelectedCarouselSlideSettings = useCallback((slideId: string, newSettings: EditorSettings) => {
      setSelectedCarousel(prevCarousel => {
          if (!prevCarousel) return null;
          const updatedSlides = prevCarousel.slides.map(slide =>
              slide.id === slideId ? { ...slide, settings: newSettings } : slide
          );
          return { ...prevCarousel, slides: updatedSlides };
      });
  }, []);

  const updateSelectedCarouselCaption = useCallback((newCaption: string) => {
    setSelectedCarousel(prevCarousel => {
      if (!prevCarousel) return null;
      return { ...prevCarousel, caption: newCaption };
    });
  }, []);

  const handleApplyGlobalCarouselStyles = useCallback((globalStyles: GlobalStyleSettings) => {
    setSelectedCarousel(prevCarousel => {
        if (!prevCarousel) return null;
        const updatedSlides = prevCarousel.slides.map(slide => ({
            ...slide,
            settings: {
                ...slide.settings,
                ...globalStyles,
            }
        }));
        return { ...prevCarousel, slides: updatedSlides };
    });
  }, []);

  const handleApplyPresetToCarousel = useCallback((presetSettings: EditorSettings) => {
    setSelectedCarousel(prevCarousel => {
        if (!prevCarousel) return null;
        const updatedSlides = prevCarousel.slides.map(slide => ({
            ...slide,
            settings: presetSettings
        }));
        return { ...prevCarousel, slides: updatedSlides };
    });
  }, []);

  const handleApplyPresetToSingleCreative = (presetSettings: EditorSettings) => {
    if (selectedCreative) {
        const updatedSettings = { ...selectedCreative.settings, ...presetSettings };
        const updatedCreative = { ...selectedCreative, settings: updatedSettings };
        
        setSelectedCreative(updatedCreative);
        setEditorSettings(updatedSettings); // Also update the editor panel state
        setGeneratedCreatives(prev => prev.map(c => c.id === updatedCreative.id ? updatedCreative : c));
    }
  };

  const handleRegenerateSlideImage = useCallback(async (slideId: string, newPrompt: string) => {
    setSelectedCarousel(prevCarousel => {
        if (!prevCarousel) return null;
        const slidesWithLoading = prevCarousel.slides.map(s => s.id === slideId ? { ...s, isGenerating: true } : s);
        return { ...prevCarousel, slides: slidesWithLoading };
    });

    try {
        let newImageB64: string;
        if (expertImageB64) {
            newImageB64 = await recreateExpertImage(expertImageB64.data, expertImageB64.mimeType, newPrompt, "4:5");
        } else {
            newImageB64 = await generateImage(newPrompt, "4:5");
        }

        setSelectedCarousel(prevCarousel => {
            if (!prevCarousel) return null;
            const updatedSlides = prevCarousel.slides.map(s => {
                if (s.id === slideId) {
                    return { ...s, imagePrompt: newPrompt, imageUrl: `data:image/png;base64,${newImageB64}`, isGenerating: false };
                }
                return s;
            });
            return { ...prevCarousel, slides: updatedSlides };
        });
    } catch (error) {
        if (!handleApiKeyError(error)) {
            console.error("Falha ao regenerar a imagem do slide", error);
            setErrorMessage(error instanceof Error ? error.message : "Falha ao regenerar a imagem do slide.");
        }
    } finally {
        setSelectedCarousel(prevCarousel => {
            if (!prevCarousel) return null;
            const slidesWithoutLoading = prevCarousel.slides.map(s => s.id === slideId ? { ...s, isGenerating: false } : s);
            return { ...prevCarousel, slides: slidesWithoutLoading };
        });
    }
  }, [expertImageB64]);

  const handleReorderCarouselSlides = useCallback((dragIndex: number, hoverIndex: number) => {
    setSelectedCarousel(prevCarousel => {
      if (!prevCarousel) return null;
      
      const slides = [...prevCarousel.slides];
      const [draggedItem] = slides.splice(dragIndex, 1);
      slides.splice(hoverIndex, 0, draggedItem);

      return { ...prevCarousel, slides: slides };
    });
  }, []);
  
  const handleAddCarouselSlide = useCallback(() => {
      setSelectedCarousel(prevCarousel => {
        if (!prevCarousel) return null;

        const newSlide: CarouselSlide = {
          id: `slide-${Date.now()}`,
          title: 'Novo Título',
          subtitle: 'Clique para editar o subtítulo.',
          imagePrompt: 'Uma imagem de fundo minimalista e inspiradora.',
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTFhY2FjIiAvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2QzcyODAiIHRleHQtYW5jaGyPSJtaWRkbGUiIGR5PSIuM2VtIj5HZXJlIHN1YSBpbWFnZW08L3RleHQ+Cjwvc3ZnPg==',
          settings: INITIAL_CAROUSEL_SLIDE_SETTINGS,
          isGenerating: false,
        };

        return {
          ...prevCarousel,
          slides: [...prevCarousel.slides, newSlide],
        };
      });
    }, []);

  const handleSaveToHistory = (itemToSave: AdCreative | CarouselCreative) => {
      const isCarousel = 'slides' in itemToSave;
      let historyItem: HistoryItem;

      if (isCarousel) {
          historyItem = { type: 'carousel', content: itemToSave as CarouselCreative };
      } else {
          const creativeWithSettings = {
              ...(itemToSave as AdCreative),
              settings: editorSettings 
          };
          historyItem = { type: 'single', content: creativeWithSettings };
      }

      setHistory(prevHistory => {
          const existingIndex = prevHistory.findIndex(h => h.content.id === itemToSave.id);
          const newHistory = [...prevHistory];

          if (existingIndex > -1) {
              newHistory[existingIndex] = historyItem;
          } else {
              newHistory.unshift(historyItem);
          }
          return newHistory;
      });
      alert('Criativo salvo no histórico!');
  };

  const handleSelectFromHistory = (item: HistoryItem) => {
    setIsViewingHistory(false);
    if (item.type === 'single') {
        const creative = item.content;
        handleSelectCreative(creative);
        setGeneratedCreatives(prev => {
            if (prev.some(c => c.id === creative.id)) {
                return prev.map(c => c.id === creative.id ? creative : c);
            }
            return [creative, ...prev];
        });
    } else {
        setSelectedCreative(null);
        setSelectedCarousel(item.content);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Tem certeza de que deseja limpar todo o histórico? Esta ação não pode ser desfeita.")) {
      setHistory([]);
    }
  };

  const handleTranscription = async (blob: Blob): Promise<string> => {
    try {
        return await transcribeAudio(blob);
    } catch (error) {
        handleApiKeyError(error);
        throw error;
    }
  };

  const handleFileExtraction = async (file: File): Promise<string> => {
    try {
        const fileData = await blobToBase64(file);
        return await extractTextFromFile(fileData);
    } catch (error) {
        handleApiKeyError(error);
        throw error;
    }
  };

  if (isCheckingApiKey) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader size="h-12 w-12"/>
        </div>
    );
  }

  if (!isApiKeySet) {
    const handleTempSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempApiKey.trim()) {
            setErrorMessage('Por favor, insira uma chave de API.');
            return;
        }
        handleApiKeySubmit(tempApiKey, rememberApiKey);
    };

    return (
        <div className="min-h-screen bg-white text-brand-gray p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
            <div className="max-w-2xl mx-auto p-8 bg-gray-50 rounded-lg shadow-lg text-center">
                 <h1 className="text-4xl sm:text-5xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-brand-green">
                    Imperatriz dos criativos com IA
                </h1>
                <p className="text-brand-gray mt-2 mb-6">By Tata Gonçalves</p>
                <h2 className="text-2xl font-bold font-poppins mb-4 text-brand-gold">Insira sua Chave de API do Gemini</h2>
                <p className="text-brand-gray mb-6">
                   Para usar este aplicativo, você precisa fornecer sua própria chave de API do Google AI Studio. O uso da API pode incorrer em custos na sua conta Google.
                </p>
                <form onSubmit={handleTempSubmit} className="mt-6 space-y-4">
                    <Input 
                        type="password" 
                        placeholder="Cole sua chave de API aqui" 
                        value={tempApiKey} 
                        onChange={(e) => setTempApiKey(e.target.value)} 
                        autoFocus 
                    />
                    <div className="flex items-center justify-center">
                        <input 
                            id="remember-key" 
                            type="checkbox" 
                            checked={rememberApiKey} 
                            onChange={(e) => setRememberApiKey(e.target.checked)} 
                            className="h-4 w-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                        />
                        <label htmlFor="remember-key" className="ml-2 block text-sm text-brand-gray">
                            Lembrar chave neste navegador
                        </label>
                    </div>
                    {errorMessage && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-left" role="alert">
                            <strong className="font-bold">Erro: </strong>
                            <span className="block sm:inline">{errorMessage}</span>
                        </div>
                    )}
                    <Button type="submit" className="w-full">
                        Salvar e Continuar
                    </Button>
                </form>
                <p className="text-xs text-gray-500 mt-4">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-gold">
                        Obtenha sua chave de API no Google AI Studio.
                    </a>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-gold">
                        Saiba mais sobre preços e faturamento.
                    </a>
                </p>
            </div>
        </div>
    );
  }

  if (appStep === 'input') {
    return (
      <div className="min-h-screen bg-white text-brand-gray p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-brand-green">
            Imperatriz dos criativos com IA
          </h1>
          <p className="text-brand-gray mt-2">By Tata Gonçalves</p>
        </header>
        <ProjectInput onSubmit={handleProjectSubmit} onTranscribe={handleTranscription} onExtractFile={handleFileExtraction} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-brand-gray p-4 sm:p-6 lg:p-8">
      <div
        ref={offscreenRenderRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          pointerEvents: 'none',
          opacity: 0,
        }}
      />
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-brand-green">
          Imperatriz dos criativos com IA
        </h1>
        <p className="text-brand-gray mt-2">By Tata Gonçalves</p>
        <div className="flex justify-center items-center flex-wrap gap-4 mt-6 border-b border-gray-200 pb-6 mb-8">
          <Button 
            onClick={() => setIsViewingHistory(false)} 
            variant={!isViewingHistory ? 'primary' : 'secondary'}
            disabled={isLoading}
          >
            Gerador
          </Button>
          <Button 
            onClick={() => setIsViewingHistory(true)} 
            variant={isViewingHistory ? 'primary' : 'secondary'}
            disabled={isLoading}
          >
            Histórico ({history.length})
          </Button>
          <Button 
            onClick={() => {
              setGeminiApiKey('');
              setIsApiKeySet(false);
              sessionStorage.removeItem('geminiApiKey');
              localStorage.removeItem('geminiApiKey');
            }}
            variant="secondary"
            disabled={isLoading}
          >
            Trocar Chave de API
          </Button>
          {(generatedCreatives.length > 0 || selectedCarousel) && (
              <Button 
                onClick={handleReset}
                variant="secondary"
                className="bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500"
              >
                Começar Novo Projeto
              </Button>
          )}
        </div>
      </header>
      
      {isViewingHistory ? (
        <HistoryPanel 
          items={history}
          onSelect={handleSelectFromHistory}
          onClear={handleClearHistory}
        />
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            {(selectedCreative || selectedCarousel) ? (
              selectedCreative ? (
                <EditorPanel 
                  creative={selectedCreative}
                  settings={editorSettings}
                  onSettingsChange={setEditorSettings}
                  aspectRatios={ASPECT_RATIOS}
                  activeAspectRatio={activeAspectRatio}
                  onAspectRatioChange={setActiveAspectRatio}
                  onDownload={handleDownload}
                  onBack={() => setSelectedCreative(null)}
                  previewScale={previewScale}
                  onScaleChange={setPreviewScale}
                  onSaveToHistory={handleSaveToHistory}
                  onApplyPreset={handleApplyPresetToSingleCreative}
                  onGenerateAudio={handleGenerateAudio}
                  onRemoveAudio={handleRemoveAudio}
                />
              ) : selectedCarousel ? (
                <CarouselEditorPanel
                  carousel={selectedCarousel}
                  onSlideSettingsChange={updateSelectedCarouselSlideSettings}
                  onCaptionChange={updateSelectedCarouselCaption}
                  onRegenerateImage={handleRegenerateSlideImage}
                  onDownloadSlides={handleDownloadCarouselSlides}
                  onBack={() => setSelectedCarousel(null)}
                  promptContext={promptContext}
                  onSaveToHistory={handleSaveToHistory}
                  onApplyGlobalStyles={handleApplyGlobalCarouselStyles}
                  onApplyLayoutPreset={handleApplyPresetToCarousel}
                  onReorderSlides={handleReorderCarouselSlides}
                  onAddSlide={handleAddCarouselSlide}
                  onDownloadSingleSlide={handleDownloadSingleSlide}
                />
              ) : null
            ) : (
              <CreativeControls 
                onGenerate={handleGenerate} 
                isLoading={isLoading}
                promptContext={promptContext}
                setPromptContext={setPromptContext}
                onTranscribe={handleTranscription}
                onExtractFile={handleFileExtraction}
              />
            )}
          </div>
          
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
                  <Loader />
                  <p className="mt-4 text-lg text-gray-600">{loadingMessage}</p>
              </div>
            ) : errorMessage ? (
               <div className="h-full flex flex-col items-center justify-center bg-red-50 border border-red-300 text-red-800 rounded-lg p-8 text-center">
                <p className="font-semibold">Ocorreu um erro</p>
                <p className="mt-2">{errorMessage}</p>
                <Button onClick={() => setErrorMessage('')} variant="secondary" className="mt-4">
                  Voltar e Tentar Novamente
                </Button>
              </div>
            ) : selectedCarousel ? (
                <CarouselPreview 
                    carousel={selectedCarousel}
                    onSlideTextChange={updateSelectedCarouselSlideText}
                />
            ) : generatedCreatives.length > 0 ? (
                selectedCreative ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full flex justify-center items-center overflow-auto p-4 min-h-[650px]">
                      <div 
                        style={{ transform: `scale(${previewScale})`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}
                        ref={adPreviewRef}
                      >
                        <AdPreview 
                          creative={selectedCreative}
                          aspectRatio={activeAspectRatio}
                          settings={editorSettings}
                          onTextChange={updateSelectedCreativeText}
                        />
                      </div>
                    </div>
                    <div className="mt-4 w-full max-w-sm">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">Legenda Gerada:</h3>
                      <p className="text-sm bg-gray-100 p-3 rounded-md text-gray-700 whitespace-pre-wrap">{selectedCreative.caption}</p>
                    </div>
                  </div>
                ) : (
                  <GeneratedVariations 
                    creatives={generatedCreatives}
                    onSelect={handleSelectCreative}
                  />
                )
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                <svg className="w-20 h-20 text-brand-gold opacity-30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.5 22H4.5C3.39543 22 2.5 21.1046 2.5 20V4C2.5 2.89543 3.39543 2 4.5 2H14.9393C15.2155 2 15.4809 2.10536 15.6819 2.3064L21.6936 8.3181C21.8946 8.51914 22 8.78447 22 9.06066V20C22 21.1046 21.1046 22 20 22H19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 14.5L9.5 12L13 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.5 14L14.5 12L17.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 2V8.5C14.5 8.77614 14.7239 9 15 9H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                <p className="mt-4 text-xl font-semibold text-gray-700">Seus criativos aparecerão aqui.</p>
                <p className="text-gray-500 mt-1">Preencha as informações à esquerda para iniciar a magia.</p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
