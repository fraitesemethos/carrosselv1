import React from 'react';

interface FileInputProps {
  id: string;
  onFileChange: (file: File | null) => void;
  fileName: string | undefined;
  accept?: string;
}

const FileInput: React.FC<FileInputProps> = ({ id, onFileChange, fileName, accept = "image/*" }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileChange(event.target.files[0]);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition w-full inline-block text-center">
        {fileName ? 'Alterar Arquivo' : 'Escolher Arquivo'}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      {fileName && <p className="text-xs text-gray-500 mt-2 truncate">Selecionado: {fileName}</p>}
    </div>
  );
};

export default FileInput;