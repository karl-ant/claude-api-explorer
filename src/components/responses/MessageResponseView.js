import React from 'react';
import htm from 'htm';
import { extractMessageText } from '../../utils/formatters.js';
import ActualCostCard from './ActualCostCard.js';

const html = htm.bind(React.createElement);

export function MessageResponseView({
  response,
  toolExecutionDetails,
  models,
  maxTokens,
  tokenCount,
  model
}) {
  const [showThinking, setShowThinking] = React.useState(false);

  if (!response) return null;

  // Extract thinking blocks from content
  const thinkingBlocks = Array.isArray(response.content)
    ? response.content.filter(b => b.type === 'thinking')
    : [];
  const hasThinking = thinkingBlocks.length > 0;

  return html`
    <div class="space-y-4 animate-slide-up">
      ${hasThinking && html`
        <div class="border-l-2 border-purple-500 bg-slate-800/30 rounded-r-lg p-4 backdrop-blur-sm">
          <button
            onClick=${() => setShowThinking(!showThinking)}
            class="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors font-mono w-full"
          >
            <span>${showThinking ? '▼' : '▶'}</span>
            <span>Thinking</span>
            ${response.usage?.thinking_tokens && html`
              <span class="text-xs text-purple-500">(${response.usage.thinking_tokens.toLocaleString()} tokens)</span>
            `}
          </button>
          ${showThinking && html`
            <div class="mt-3 text-sm text-purple-200/80 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
              ${thinkingBlocks.map((block, i) => html`
                <div key=${i}>${block.thinking}</div>
              `)}
            </div>
          `}
        </div>
      `}

      <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm hover-lift">
        <div class="text-base leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">
          ${extractMessageText(response.content)}
        </div>
      </div>

      ${toolExecutionDetails && toolExecutionDetails.length > 0 && html`
        <div class="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2 font-mono">
            <span>🔧</span>
            <span>Tools Executed (${toolExecutionDetails.length})</span>
          </h3>
          <div class="space-y-3">
            ${toolExecutionDetails.map((tool, idx) => html`
              <div key=${idx} class="bg-slate-800/50 rounded-lg p-3 border border-purple-700/30">
                <div class="font-medium text-purple-300 mb-2 font-mono">
                  ${tool.tool_name}
                </div>
                <div class="space-y-2 text-xs">
                  <div>
                    <div class="text-purple-400 font-medium mb-1 font-mono">Input:</div>
                    <pre class="bg-slate-950 p-2 rounded text-purple-200 overflow-x-auto font-mono border border-slate-700 whitespace-pre-wrap break-words">${JSON.stringify(tool.tool_input, null, 2)}</pre>
                  </div>
                  <div>
                    <div class="text-mint-400 font-medium mb-1 font-mono">Result:</div>
                    <pre class="bg-slate-950 p-2 rounded text-mint-200 overflow-x-auto font-mono border border-slate-700 whitespace-pre-wrap break-words">${tool.tool_result}</pre>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      `}

      ${response.container && html`
        <div class="bg-teal-900/20 border border-teal-700/50 rounded-lg p-4 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2 font-mono">
            <span>📄</span>
            <span>Skills Executed</span>
          </h3>
          <div class="space-y-3">
            ${response.container.skills && response.container.skills.map((skill, idx) => html`
              <div key=${idx} class="bg-slate-800/50 rounded-lg p-3 border border-teal-700/30">
                <div class="font-medium text-teal-300 mb-2 font-mono">
                  ${skill.skill_id || skill.type}
                </div>
                <pre class="bg-slate-950 p-2 rounded text-teal-200 overflow-x-auto font-mono border border-slate-700 text-xs whitespace-pre-wrap break-words">${JSON.stringify(skill, null, 2)}</pre>
              </div>
            `)}
          </div>
        </div>
      `}

      ${response.usage && html`
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm bg-slate-800/30 border border-slate-700 rounded-lg px-4 py-2 backdrop-blur-sm">
            <span class="text-slate-400 font-medium font-mono">Model:</span>
            <span class="font-semibold text-amber-400 font-mono">${response.model}</span>
          </div>
          <${ActualCostCard}
            usage=${response.usage}
            model=${response.model}
            models=${models}
            maxTokens=${maxTokens}
            tokenCount=${tokenCount}
            selectedModel=${model}
          />
          ${response.stop_reason && html`
            <div class="flex items-center justify-between text-sm bg-slate-800/30 border border-slate-700 rounded-lg px-4 py-2 backdrop-blur-sm">
              <span class="text-slate-400 font-medium font-mono">Stop Reason:</span>
              <span class="font-semibold text-slate-300 font-mono">${response.stop_reason}</span>
            </div>
          `}
        </div>
      `}
    </div>
  `;
}

export default MessageResponseView;
