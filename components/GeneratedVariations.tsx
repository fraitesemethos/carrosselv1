import React from 'react';
import { AdCreative } from '../types';

interface GeneratedVariationsProps {
  creatives: AdCreative[];
  onSelect: (creative: AdCreative) => void;
}

const GeneratedVariations: React.FC<GeneratedVariationsProps> = ({ creatives, onSelect }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-2xl font-bold font-poppins mb-4 text-center text-brand-gray">Escolha uma Variação para Editar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {creatives.map((creative) => (
          <div
            key={creative.id}
            className="relative rounded-lg overflow-hidden cursor-pointer group border-2 border-transparent hover:border-brand-gold transition-all duration-300"
            onClick={() => onSelect(creative)}
          >
            <img src={creative.imageUrl} alt={creative.title} className="w-full h-full object-cover aspect-square" />
            <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-70 transition-all duration-300 flex flex-col justify-center items-center text-center p-4 opacity-0 group-hover:opacity-100">
              <h3 className="text-lg font-bold text-white">{creative.title}</h3>
              <p className="text-sm text-gray-200 mt-1">{creative.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedVariations;