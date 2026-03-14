import React from 'react';
import ReactDOM from 'react-dom/client';
import { CaptionDisplay } from './CaptionDisplay';
import '../renderer/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CaptionDisplay />
  </React.StrictMode>,
);
