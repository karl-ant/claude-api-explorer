import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function CostResponseView({ costReport, response }) {
  const report = costReport || response;
  if (!report) return null;

  const totalCost = (report.data || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) / 100;

  return html`
    <div class="space-y-3 animate-slide-up">
      <div class="bg-mint-900/20 border border-mint-700/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-mint-300 font-mono">Total Cost</span>
          <span class="text-2xl font-bold text-mint-400 font-mono">
            $${totalCost.toFixed(2)}
          </span>
        </div>
      </div>

      ${(report.data || []).map((item, idx) => html`
        <div key=${idx} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
          <div class="flex justify-between items-start mb-2">
            <div>
              ${item.description && html`
                <div class="font-medium text-base text-slate-100 font-mono">${item.description}</div>
              `}
              ${item.workspace_id && html`
                <div class="text-xs text-slate-400 font-mono mt-1">
                  Workspace: <span class="text-amber-400">${item.workspace_id}</span>
                </div>
              `}
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-mint-400 font-mono">
                $${(parseFloat(item.amount || 0) / 100).toFixed(2)}
              </div>
              <div class="text-xs text-slate-500 font-mono">USD</div>
            </div>
          </div>
          ${item.start_time && item.end_time && html`
            <div class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700 font-mono">
              ${new Date(item.start_time).toLocaleDateString()} - ${new Date(item.end_time).toLocaleDateString()}
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

export default CostResponseView;
