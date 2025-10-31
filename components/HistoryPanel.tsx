import React from 'react';
import { HistoryItem, AdCreative, CarouselCreative } from '../types';
import Button from './ui/Button';

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ items, onSelect, onClear }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold font-poppins text-brand-gray">Seu Histórico de Criativos</h2>
        {items.length > 0 && (
          <Button onClick={onClear} variant="secondary">
            Limpar Histórico
          </Button>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="mt-4 text-xl text-gray-600">Seu histórico está vazio.</p>
          <p className="text-gray-500">Os criativos que você gerar e salvar aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
              const creative = item.content as AdCreative; // For single creative data
              const carousel = item.content as CarouselCreative; // For carousel data
              const thumbnailUrl = item.type === 'single' ? creative.imageUrl : carousel.slides[0]?.imageUrl;
              const title = item.type === 'single' ? creative.title : "Carrossel";
              const subtitle = item.type === 'single' ? creative.subtitle : `${carousel.slides.length} slides`;

              return (
                <div
                  key={item.content.id}
                  className="relative rounded-lg overflow-hidden cursor-pointer group border-2 border-transparent hover:border-brand-gold transition-all duration-300 shadow-md"
                  onClick={() => onSelect(item)}
                >
                  {thumbnailUrl && <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover aspect-square" />}
                  
                  {item.type === 'carousel' && (
                    <div className="absolute top-2 right-2 bg-brand-gold/80 text-white rounded-full p-1.5 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/80 transition-all duration-300 flex flex-col justify-end text-left p-4">
                    <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                    <p className="text-sm text-gray-200 mt-1 truncate">{subtitle}</p>
                  </div>
                </div>
              )
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
