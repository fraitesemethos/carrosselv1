
import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import FileInput from './ui/FileInput';
import { GenerationMode } from '../types';
import Loader from './ui/Loader';

interface CreativeControlsProps {
  onGenerate: (backgroundPrompt: string, expertImageFile: File | null, generationMode: GenerationMode) => void;
  isLoading: boolean;
  promptContext: string;
  setPromptContext: (content: string) => void;
  onTranscribe: (blob: Blob) => Promise<string>;
  onExtractFile: (file: File) => Promise<string>;
}

const CreativeControls: React.FC<CreativeControlsProps> = ({ 
  onGenerate, 
  isLoading, 
  promptContext, 
  setPromptContext,
  onTranscribe,
  onExtractFile 
}) => {
  const [generationMode, setGenerationMode] = useState<GenerationMode>('carousel');
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [expertImageFile, setExpertImageFile] = useState<File | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    setError('');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsTranscribing(true);
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          try {
            const transcription = await onTranscribe(audioBlob);
            setPromptContext(prev => prev ? `${prev.trim()}\n\n--- TRANSCRIÇÃO DE ÁUDIO ---\n\n${transcription}` : transcription);
          } catch (err) {
            setError('Falha ao transcrever o áudio. Tente novamente.');
            console.error(err);
          } finally {
            setIsTranscribing(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Erro ao acessar o microfone:", err);
        setError("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
      }
    } else {
      setError("Gravação de áudio não é suportada neste navegador.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError('');
    setIsProcessingFile(true);

    try {
      const extractedText = await onExtractFile(file);
      setPromptContext(prev => prev ? `${prev.trim()}\n\n--- CONTEÚDO DO DOCUMENTO ---\n\n${extractedText}` : extractedText);
    } catch (err) {
      setError('Falha ao processar o documento. Tente novamente.');
      console.error(err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(backgroundPrompt, expertImageFile, generationMode);
  };

  const isBusy = isRecording || isTranscribing || isProcessingFile;

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-lg sticky top-8">
      <h2 className="text-xl font-bold font-poppins mb-4">Crie Seu Anúncio</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Geração</label>
          <div className="flex gap-2 rounded-md bg-gray-200 p-1">
              <button type="button" onClick={() => setGenerationMode('single')} className={`flex-1 py-2 text-sm rounded-md transition ${generationMode === 'single' ? 'bg-white shadow text-brand-gold font-semibold' : 'text-brand-gray hover:bg-white/50'}`}>
                  Imagem Única
              </button>
              <button type="button" onClick={() => setGenerationMode('carousel')} className={`flex-1 py-2 text-sm rounded-md transition ${generationMode === 'carousel' ? 'bg-white shadow text-brand-gold font-semibold' : 'text-brand-gray hover:bg-white/50'}`}>
                  Carrossel
              </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="promptContext" className="block text-sm font-medium text-gray-700 mb-1">
            Estratégia do Anúncio / Roteiro
          </label>
          <textarea
            id="promptContext"
            value={promptContext}
            onChange={(e) => setPromptContext(e.target.value)}
            placeholder={"Descreva o objetivo, público e a ideia central do seu anúncio, ou cole seu roteiro aqui."}
            className="w-full h-32 p-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-gold transition"
            required
            disabled={isBusy}
          />
           <p className="text-xs text-gray-500 mt-1">Este é o cérebro da operação. Diga à IA o que você quer alcançar.</p>
        </div>
        
        {/* Audio and File Input Controls */}
        <div className="flex items-center gap-2">
            <Button 
                type="button" 
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isBusy && !isRecording}
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-2 px-2"
                aria-label={isRecording ? "Parar gravação" : "Iniciar gravação de áudio"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17h-2v-2.07A8.002 8.002 0 012 8V7h2v1a6 6 0 1012 0V7h2v1a8.002 8.002 0 01-5 7.484z" />
                </svg>
                {isRecording && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                {isTranscribing && '...'}
            </Button>
            <div className="relative flex-1">
                <label htmlFor="doc-upload-controls" className={`cursor-pointer bg-gray-200 hover:bg-gray-300 text-brand-gray font-semibold px-2 py-2.5 rounded-md transition-all duration-200 w-full inline-flex items-center justify-center gap-2 ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5a.5.5 0 010-1H13V8.5a.5.5 0 01.5-.5h.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-2.5a.5.5 0 01-.5-.5V13H5.5z" />
                        <path d="M3 13.5a1 1 0 011-1h1.5a.5.5 0 010 1H4a1 1 0 01-1-1z" />
                    </svg>
                </label>
                <input
                    id="doc-upload-controls"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                    onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                    disabled={isBusy}
                />
            </div>
        </div>
         {(isBusy) && (
            <div className="flex items-center justify-center text-sm text-gray-500">
                <Loader size="h-4 w-4" />
                <span className="ml-2">
                    {isRecording && 'Gravando áudio...'}
                    {isTranscribing && 'Transcrevendo áudio...'}
                    {isProcessingFile && 'Analisando documento...'}
                </span>
            </div>
        )}
        {error && <p className="text-red-600 text-xs text-center">{error}</p>}

        <div>
          <label htmlFor="backgroundPrompt" className="block text-sm font-medium text-gray-700 mb-1">
            Guia de Estilo Visual <span className="text-gray-400">(Opcional)</span>
          </label>
          <Input
            id="backgroundPrompt"
            value={backgroundPrompt}
            onChange={(e) => setBackgroundPrompt(e.target.value)}
            placeholder="Ex: 'Fotografia minimalista, tons pastéis, luz suave'"
          />
          <p className="text-xs text-gray-500 mt-1">Descreva a aparência desejada para as imagens de fundo.</p>
        </div>
        
        <div>
          <label htmlFor="expertImage" className="block text-sm font-medium text-gray-700 mb-1">
            Imagem do Especialista <span className="text-gray-400">(Opcional)</span>
          </label>
          <FileInput
            id="expertImage"
            onFileChange={setExpertImageFile}
            fileName={expertImageFile?.name}
            accept="image/*"
          />
          <p className="text-xs text-gray-500 mt-1">Envie uma foto para destacar uma pessoa específica no anúncio.</p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isBusy}>
          {isLoading ? 'Gerando...' : 'Gerar Criativos'}
        </Button>
      </form>
    </div>
  );
};

export default CreativeControls;
