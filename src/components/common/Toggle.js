import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function Toggle({ label, checked, onChange, disabled = false }) {
  return html`
    <label class="flex items-center cursor-pointer group">
      <div class="relative">
        <input
          type="checkbox"
          class="sr-only"
          checked=${checked}
          onChange=${(e) => onChange(e.target.checked)}
          disabled=${disabled}
        />
        <div
          class="block w-11 h-6 rounded-full transition-all duration-200 ${
            checked
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30'
              : 'bg-slate-700 border border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-slate-500'}"
        ></div>
        <div
          class="dot absolute left-1 top-1 bg-slate-100 w-4 h-4 rounded-full transition-all duration-200 shadow-md ${
            checked ? 'transform translate-x-5' : ''
          }"
        ></div>
      </div>
      ${label && html`<div class="ml-3 text-sm font-medium text-slate-300 font-mono group-hover:text-slate-200 transition-colors">${label}</div>`}
    </label>
  `;
}
