import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppV2 } from './AppV2';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <AppV2 />
    </React.StrictMode>
);
