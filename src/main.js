import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import FullApp from './FullApp.js';

const html = htm.bind(React.createElement);

const root = createRoot(document.getElementById('root'));
root.render(html`<${FullApp} />`);
