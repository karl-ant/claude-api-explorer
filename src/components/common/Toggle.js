import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function Toggle({ label, checked, onChange, disabled = false }) {
  return html`
    <label class="flex items-center cursor-pointer">
      <div class="relative">
        <input
          type="checkbox"
          class="sr-only"
          checked=${checked}
          onChange=${(e) => onChange(e.target.checked)}
          disabled=${disabled}
        />
        <div
          class="block w-10 h-6 rounded-full transition-colors duration-200 ${
            checked ? 'bg-blue-600' : 'bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}"
        ></div>
        <div
          class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
            checked ? 'transform translate-x-4' : ''
          }"
        ></div>
      </div>
      ${label && html`<div class="ml-3 text-sm font-medium text-gray-700">${label}</div>`}
    </label>
  `;
}
