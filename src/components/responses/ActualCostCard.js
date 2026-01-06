import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function ActualCostCard({ usage, model, models, maxTokens, tokenCount, selectedModel }) {
  const getPricing = (modelId) => {
    const modelConfig = models.find(m => m.id === modelId);
    return modelConfig?.pricing || { input: 3, output: 15 };
  };

  // Actual costs use response model pricing
  const actualPricing = getPricing(model);
  const inputCost = (usage.input_tokens / 1_000_000) * actualPricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * actualPricing.output;
  const totalCost = inputCost + outputCost;
  const totalTokens = usage.input_tokens + usage.output_tokens;

  // Estimated costs use selected model pricing (what user expected before sending)
  const estPricing = getPricing(selectedModel || model);
  const estInputCost = tokenCount ? (tokenCount / 1_000_000) * estPricing.input : inputCost;
  const estOutputCost = (maxTokens / 1_000_000) * estPricing.output;
  const estTotalCost = estInputCost + estOutputCost;

  return html`
    <div class="bg-slate-800/50 border border-mint-700/50 rounded-lg p-3 backdrop-blur-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-300 font-mono">Total Tokens</span>
        <span class="text-xl font-bold text-mint-400 font-mono">
          ${totalTokens.toLocaleString()}
        </span>
      </div>

      <div class="text-xs font-mono border-t border-slate-700 pt-2 mt-2">
        <div class="grid grid-cols-3 gap-2 mb-1">
          <span class="text-slate-500"></span>
          <span class="text-slate-500 text-right">Estimate</span>
          <span class="text-slate-500 text-right">Actual</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-slate-400">
          <span>Input:</span>
          <span class="text-right text-slate-500">$${estInputCost.toFixed(5)}</span>
          <span class="text-right text-mint-400">$${inputCost.toFixed(5)}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-slate-400">
          <span>Output:</span>
          <span class="text-right text-slate-500">$${estOutputCost.toFixed(5)}</span>
          <span class="text-right text-mint-400">$${outputCost.toFixed(5)}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-slate-300 font-medium pt-1 border-t border-slate-700/50 mt-1">
          <span>Total:</span>
          <span class="text-right text-slate-400">$${estTotalCost.toFixed(5)}</span>
          <span class="text-right text-amber-400">$${totalCost.toFixed(5)}</span>
        </div>
        <div class="text-slate-600 text-center pt-2">
          Prices as of Nov 2025
        </div>
      </div>
    </div>
  `;
}

export default ActualCostCard;
