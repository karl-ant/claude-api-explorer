import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function UsageResponseView({ usageReport, response }) {
  const report = usageReport || response;
  if (!report) return null;

  return html`
    <div class="space-y-3 animate-slide-up">
      ${(report.data || []).map((bucket, idx) => html`
        <div key=${idx} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
          <div class="font-medium text-base text-slate-100 mb-3 font-mono">
            ${new Date(bucket.start_time).toLocaleString()} - ${new Date(bucket.end_time).toLocaleString()}
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="space-y-1">
              <div class="text-slate-400 text-xs font-medium font-mono">Input Tokens</div>
              <div class="text-lg font-semibold text-mint-400 font-mono">
                ${(bucket.input_tokens || 0).toLocaleString()}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-slate-400 text-xs font-medium font-mono">Output Tokens</div>
              <div class="text-lg font-semibold text-mint-400 font-mono">
                ${(bucket.output_tokens || 0).toLocaleString()}
              </div>
            </div>
            ${bucket.cache_creation_input_tokens !== undefined && html`
              <div class="space-y-1">
                <div class="text-slate-400 text-xs font-medium font-mono">Cache Creation</div>
                <div class="text-base font-semibold text-amber-400 font-mono">
                  ${(bucket.cache_creation_input_tokens || 0).toLocaleString()}
                </div>
              </div>
            `}
            ${bucket.cache_read_input_tokens !== undefined && html`
              <div class="space-y-1">
                <div class="text-slate-400 text-xs font-medium font-mono">Cache Read</div>
                <div class="text-base font-semibold text-mint-300 font-mono">
                  ${(bucket.cache_read_input_tokens || 0).toLocaleString()}
                </div>
              </div>
            `}
          </div>
          ${bucket.model && html`
            <div class="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400 font-mono">
              Model: <span class="text-amber-400">${bucket.model}</span>
            </div>
          `}
          ${bucket.workspace_id && html`
            <div class="mt-1 text-xs text-slate-400 font-mono">
              Workspace: <span class="text-amber-400">${bucket.workspace_id}</span>
            </div>
          `}
        </div>
      `)}
      ${report.has_more && html`
        <div class="text-sm text-slate-500 text-center py-2 font-mono">
          More data available (use pagination)
        </div>
      `}
    </div>
  `;
}

export default UsageResponseView;
