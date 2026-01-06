import React, { useState } from 'react';
import htm from 'htm';
import { Button } from '../common/Button.js';

const html = htm.bind(React.createElement);

export function BatchResponseView({
  response,
  batchStatus,
  batchResultsData,
  batchResultsLoading,
  batchResultsError,
  handleFetchBatchResults,
  handleGetBatchStatus
}) {
  const [expandedResults, setExpandedResults] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const batch = response || batchStatus;
  if (!batch) return null;

  const toggleResultExpanded = (index) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedResults({});
    } else {
      const all = {};
      batchResultsData?.forEach((_, i) => { all[i] = true; });
      setExpandedResults(all);
    }
    setAllExpanded(!allExpanded);
  };

  return html`
    <div class="space-y-4 animate-slide-up">
      <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-100 font-mono">Batch Information</h3>
          <${Button}
            onClick=${() => handleGetBatchStatus(batch.id)}
            variant="secondary"
            size="sm"
          >
            Refresh Status
          </${Button}>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium font-mono">Batch ID:</span>
            <span class="font-mono text-amber-400">${batch.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 font-medium font-mono">Status:</span>
            <span class="font-semibold text-mint-400 font-mono">${batch.processing_status}</span>
          </div>
          ${batch.request_counts && html`
            <div class="mt-3 pt-3 border-t border-slate-700">
              <div class="text-slate-300 font-medium mb-2 font-mono">Request Counts:</div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-500 font-mono">Processing:</span>
                  <span class="font-semibold text-slate-300 font-mono">${batch.request_counts.processing || 0}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-mono">Succeeded:</span>
                  <span class="font-semibold text-mint-400 font-mono">${batch.request_counts.succeeded || 0}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-mono">Errored:</span>
                  <span class="font-semibold text-red-400 font-mono">${batch.request_counts.errored || 0}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-mono">Canceled:</span>
                  <span class="font-semibold text-slate-400 font-mono">${batch.request_counts.canceled || 0}</span>
                </div>
              </div>
            </div>
          `}
          ${batch.results_url && html`
            <div class="mt-3 pt-3 border-t border-slate-700">
              <div class="text-slate-300 font-medium mb-1 font-mono">Results URL:</div>
              <a
                href=${batch.results_url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-amber-400 hover:text-amber-300 break-all font-mono transition-colors"
              >
                ${batch.results_url}
              </a>

              <div class="flex items-center gap-2 mt-3">
                <${Button}
                  onClick=${() => handleFetchBatchResults(batch.results_url)}
                  disabled=${batchResultsLoading}
                  variant="secondary"
                  size="sm"
                >
                  ${batchResultsLoading ? 'Fetching...' : (batchResultsData ? 'Refresh Results' : 'View Results')}
                </${Button}>
              </div>

              ${batchResultsError && html`
                <div class="mt-3 bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-sm text-red-300 font-mono">
                  ${batchResultsError}
                </div>
              `}

              ${batchResultsData && batchResultsData.length > 0 && html`
                <div class="mt-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-300 font-mono">
                      ${batchResultsData.length} result${batchResultsData.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick=${toggleAllExpanded}
                      class="text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors"
                    >
                      ${allExpanded ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>

                  <div class="space-y-2 max-h-[500px] overflow-y-auto">
                    ${batchResultsData.map((result, index) => html`
                      <div key=${index} class="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover-lift">
                        <button
                          onClick=${() => toggleResultExpanded(index)}
                          class="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors text-left"
                        >
                          <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-500">#${index + 1}</span>
                            <span class="font-mono text-amber-400 text-sm">${result.custom_id}</span>
                            <span class="px-2 py-0.5 rounded text-xs font-mono ${
                              result.result?.type === 'succeeded'
                                ? 'bg-mint-900/30 text-mint-400 border border-mint-700/50'
                                : 'bg-red-900/30 text-red-400 border border-red-700/50'
                            }">
                              ${result.result?.type || 'unknown'}
                            </span>
                          </div>
                          <span class="text-slate-400 text-lg">${expandedResults[index] ? '−' : '+'}</span>
                        </button>
                        ${expandedResults[index] && html`
                          <div class="p-4 border-t border-slate-700 bg-slate-900/50">
                            <pre class="bg-slate-950 p-3 rounded-lg text-mint-300 overflow-x-auto text-xs font-mono border border-slate-800 whitespace-pre-wrap break-words">${JSON.stringify(result.result?.message || result.result || result, null, 2)}</pre>
                          </div>
                        `}
                      </div>
                    `)}
                  </div>
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

export default BatchResponseView;
