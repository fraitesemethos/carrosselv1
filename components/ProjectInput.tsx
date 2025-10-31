
import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import Loader from './ui/Loader';

interface ProjectInputProps {
  onSubmit: (info: string) => void;
  onTranscribe: (blob: Blob) => Promise<string>;
  onExtractFile: (file: File) => Promise<string>;
}

const ProjectInput: React.FC<ProjectInputProps> = ({ onSubmit, onTranscribe, onExtractFile }) => {
  const [info, setInfo] = useState('');
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
            setInfo(prev => prev ? `${prev.trim()}\n\n${transcription}` : transcription);
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
      setInfo(prev => prev ? `${prev.trim()}\n\n--- CONTEÚDO DO DOCUMENTO ---\n\n${extractedText}` : extractedText);
    } catch (err) {
      setError('Falha ao processar o documento. Tente novamente.');
      console.error(err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (info.trim()) {
      onSubmit(info.trim());
    }
  };

  const isBusy = isRecording || isTranscribing || isProcessingFile;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-50 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold font-poppins text-center mb-4 text-brand-gold">Vamos Começar</h2>
      <p className="text-center text-brand-gray mb-6">Primeiro, fale sobre seu projeto. Descreva abaixo, grave um áudio ou anexe um documento com as informações.</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          placeholder="Ex: 'Estamos lançando uma nova linha de grãos de café ecológicos...' ou use as opções abaixo."
          className="w-full h-40 p-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition duration-200 disabled:opacity-70"
          required
          disabled={isBusy}
        />
        <div className="w-full flex flex-col sm:flex-row items-center gap-4 mt-4">
            <Button type="submit" className="w-full sm:order-2" disabled={isBusy}>
                {isProcessingFile ? 'Processando...' : isTranscribing ? 'Transcrevendo...' : 'Continuar'}
            </Button>
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 sm:order-1 sm:flex-grow">
                <Button 
                    type="button" 
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isBusy && !isRecording}
                    variant="secondary"
                    className="w-full flex-grow flex items-center justify-center gap-2 px-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17h-2v-2.07A8.002 8.002 0 012 8V7h2v1a6 6 0 1012 0V7h2v1a8.002 8.002 0 01-5 7.484V17h-2v-2.07A8.002 8.002 0 017 14.93z" clipRule="evenodd" />
                    </svg>
                    {isTranscribing && 'Transcrevendo...'}
                    {!isTranscribing && isRecording && 'Parar'}
                    {!isTranscribing && !isRecording && 'Gravar Áudio'}
                    {isRecording && <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>}
                </Button>
                <div className="relative w-full flex-grow">
                    <label htmlFor="doc-upload" className={`cursor-pointer bg-gray-200 hover:bg-gray-300 text-brand-gray font-semibold px-4 py-2.5 rounded-md transition-all duration-200 w-full inline-flex items-center justify-center gap-2 ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5a.5.5 0 010-1H13V8.5a.5.5 0 01.5-.5h.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-2.5a.5.5 0 01-.5-.5V13H5.5z" />
                            <path d="M3 13.5a1 1 0 011-1h1.5a.5.5 0 010 1H4a1 1 0 01-1-1z" />
                        </svg>
                        Anexar Documento
                    </label>
                    <input
                        id="doc-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                        onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                        disabled={isBusy}
                    />
                </div>
            </div>
        </div>
        {isProcessingFile && (
            <div className="flex items-center justify-center text-sm text-gray-500 mt-4">
                <Loader size="h-5 w-5" />
                <span className="ml-2">Analisando documento... Pode levar um momento.</span>
            </div>
        )}
        {error && <p className="text-red-600 text-sm text-center mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default ProjectInput;
