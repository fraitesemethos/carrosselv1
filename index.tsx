
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('[APP] Aplicação inicializada com sucesso');
} catch (error) {
  console.error('[APP] Erro fatal ao inicializar aplicação:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: red;">
        <h1>Erro ao carregar aplicação</h1>
        <p>${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <p>Verifique o console do navegador para mais detalhes.</p>
      </div>
    `;
  }
}
