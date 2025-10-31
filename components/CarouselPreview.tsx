import React, { useState } from 'react';
import { CarouselCreative } from '../types';
import AdPreview from './AdPreview';

interface CarouselPreviewProps {
  carousel: CarouselCreative;
  onSlideTextChange?: (slideId: string, field: 'title' | 'subtitle', newText: string) => void;
}

const CarouselPreview: React.FC<CarouselPreviewProps> = ({ carousel, onSlideTextChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? carousel.slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === carousel.slides.length - 1 ? 0 : prev + 1));
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(carousel.caption).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Falha ao copiar a legenda: ', err);
      alert('Falha ao copiar a legenda.');
    });
  };


  if (!carousel || !carousel.slides || carousel.slides.length === 0) {
    return <div className="text-center p-8">Nenhum slide para exibir.</div>;
  }

  return (
    <div className="flex flex-col items-center">
        <div className="w-full max-w-[480px] relative">
            <div className="overflow-hidden rounded-lg">
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {carousel.slides.map((slide) => {
                        const adCreativeData = {
                            id: slide.id,
                            title: slide.title,
                            subtitle: slide.subtitle,
                            imageUrl: slide.imageUrl,
                            caption: '',
                            body: '',
                            backgroundPrompt: ''
                        };
                        return (
                            <div key={slide.id} className="w-full flex-shrink-0">
                                <AdPreview
                                    creative={adCreativeData}
                                    aspectRatio="4:5"
                                    settings={slide.settings}
                                    onTextChange={onSlideTextChange ? (field, value) => onSlideTextChange(slide.id, field, value) : undefined}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            {carousel.slides.length > 1 && (
                <>
                    <button 
                        onClick={goToPrevious} 
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/50 hover:bg-white/80 text-gray-800 rounded-full p-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white z-20"
                        aria-label="Slide anterior"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button 
                        onClick={goToNext} 
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/50 hover:bg-white/80 text-gray-800 rounded-full p-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white z-20"
                        aria-label="Próximo slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {carousel.slides.map((_, index) => (
                    <button 
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                        aria-label={`Ir para o slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>

        {/* Caption */}
        <div className="mt-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Legenda Gerada para o Carrossel:</h3>
                 <button
                    onClick={handleCopyCaption}
                    className="flex items-center gap-2 text-sm text-brand-gray bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md transition-all duration-200 disabled:opacity-50"
                    disabled={isCopied}
                    aria-live="polite"
                >
                    {isCopied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-green" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Copiado!
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar
                        </>
                    )}
                </button>
            </div>
            <p className="text-sm bg-gray-100 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
                {carousel.caption}
            </p>
        </div>
    </div>
  );
};

export default CarouselPreview;