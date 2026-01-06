import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function EmptyResponseState() {
  return html`
    <div class="flex items-center justify-center h-full text-slate-500">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700">
          <svg
            class="h-8 w-8 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p class="text-sm font-mono text-slate-400">No response yet</p>
        <p class="text-xs mt-1 font-mono text-slate-600">Configure your request and send</p>
      </div>
    </div>
  `;
}

export default EmptyResponseState;
