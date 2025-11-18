import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function Tabs({ tabs, activeTab, onChange }) {
  return html`
    <div class="border-b border-slate-700">
      <nav class="flex space-x-2" aria-label="Tabs">
        ${tabs.map((tab) => html`
          <button
            key=${tab.id}
            onClick=${() => onChange(tab.id)}
            class="py-2.5 px-4 text-sm font-medium font-mono border-b-2 transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400 shadow-[0_2px_10px_rgba(251,191,36,0.3)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }"
          >
            ${tab.label}
          </button>
        `)}
      </nav>
    </div>
  `;
}
