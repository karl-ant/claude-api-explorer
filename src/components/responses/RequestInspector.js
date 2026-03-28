import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function RequestInspector({ request }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const bodyJson = JSON.stringify(request.body, null, 2);
  const bodyBytes = new Blob([bodyJson]).size;
  const headerCount = Object.keys(request.headers || {}).length;
  const duration = request.durationMs != null ? `${request.durationMs.toLocaleString()}ms` : '…';

  const copyBody = () => {
    navigator.clipboard.writeText(bodyJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return html`
    <div class="bg-slate-900 border border-slate-800 rounded-lg mb-4 overflow-hidden">
      <button
        onClick=${() => setExpanded(!expanded)}
        class="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
      >
        <div class="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span class="text-mint-400">${request.method}</span>
          <span class="text-slate-300">${request.url}</span>
          <span>·</span>
          <span>${duration}</span>
          <span>·</span>
          <span>${headerCount} headers</span>
          <span>·</span>
          <span>${bodyBytes.toLocaleString()} bytes</span>
        </div>
        <span class="text-slate-500 text-xs font-mono">${expanded ? '▼' : '▶'}</span>
      </button>

      ${expanded && html`
        <div class="border-t border-slate-800 p-4 space-y-4 animate-slide-up">
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-medium text-slate-300 font-mono uppercase tracking-wide">Headers</h4>
            </div>
            <div class="bg-slate-950 border border-slate-800 rounded p-3 space-y-1">
              ${Object.entries(request.headers || {}).map(([k, v]) => html`
                <div key=${k} class="flex gap-2 text-xs font-mono">
                  <span class="text-amber-400 min-w-[140px]">${k}:</span>
                  <span class="text-slate-300 break-all">${v}</span>
                </div>
              `)}
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-medium text-slate-300 font-mono uppercase tracking-wide">Body</h4>
              <button
                onClick=${copyBody}
                class="text-xs font-mono text-slate-400 hover:text-amber-400 transition-colors"
              >
                ${copied ? '✓ copied' : 'copy json'}
              </button>
            </div>
            <pre class="bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 overflow-y-auto">${bodyJson}</pre>
          </div>

          <div class="flex gap-4 text-xs font-mono text-slate-500 pt-2 border-t border-slate-800">
            <span>Sent: ${new Date(request.timestamp).toLocaleTimeString()}</span>
            ${request.durationMs != null && html`<span>Duration: ${duration}</span>`}
          </div>
        </div>
      `}
    </div>
  `;
}

export default RequestInspector;
