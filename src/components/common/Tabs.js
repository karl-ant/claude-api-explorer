import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function Tabs({ tabs, activeTab, onChange }) {
  return html`
    <div class="border-b border-gray-200">
      <nav class="flex space-x-4" aria-label="Tabs">
        ${tabs.map((tab) => html`
          <button
            key=${tab.id}
            onClick=${() => onChange(tab.id)}
            class="py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }"
          >
            ${tab.label}
          </button>
        `)}
      </nav>
    </div>
  `;
}
