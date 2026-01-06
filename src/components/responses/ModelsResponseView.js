import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function ModelsResponseView({ modelsList }) {
  if (!modelsList) return null;

  return html`
    <div class="space-y-3 animate-slide-up">
      <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-3 backdrop-blur-sm">
        <h3 class="text-sm font-semibold text-slate-100 font-mono">
          Found ${modelsList.data?.length || 0} models
        </h3>
      </div>
      ${modelsList.data?.map((model) => html`
        <div key=${model.id} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
          <div class="font-medium text-base text-slate-100 mb-1 font-mono">
            ${model.display_name || model.id}
          </div>
          <div class="text-sm text-amber-400 font-mono mb-2">${model.id}</div>
          <div class="text-xs text-slate-500 font-mono">
            Created: ${new Date(model.created_at).toLocaleDateString()}
          </div>
        </div>
      `)}
      ${modelsList.has_more && html`
        <div class="text-sm text-slate-500 text-center py-2 font-mono">
          More models available (use pagination parameters)
        </div>
      `}
    </div>
  `;
}

export default ModelsResponseView;
