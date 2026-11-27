import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource/big-shoulders-display/latin-700';
import '@fontsource/big-shoulders-display/latin-800';
import '@fontsource/ibm-plex-mono/latin-400';
import '@fontsource/ibm-plex-mono/latin-500';
import '@fontsource/ibm-plex-mono/latin-600';
import '@fontsource/inter/latin-400';
import '@fontsource/inter/latin-500';
import '@fontsource/inter/latin-600';
import '@fontsource/inter/latin-700';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
