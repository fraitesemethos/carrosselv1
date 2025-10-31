export const blobToBase64 = (blob: Blob): Promise<{ data: string; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
            const result = reader.result as string;
            const [header, data] = result.split(',');
            // Extrai o tipo MIME do cabeçalho do data URL, com fallback para o tipo do blob e, em último caso, um padrão genérico.
            const mimeType = header.match(/:(.*?);/)?.[1] || blob.type || 'application/octet-stream';
            resolve({ data, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};
