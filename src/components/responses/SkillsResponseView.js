import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function SkillsResponseView({ skillsList, skillDetail, handleGetSkill }) {
  if (!skillsList && !skillDetail) return null;

  return html`
    <div class="space-y-3 animate-slide-up">
      ${skillsList && html`
        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-3 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-slate-100 font-mono">
            Found ${skillsList.data?.length || 0} skills
          </h3>
        </div>
        ${skillsList.data?.map((skill) => html`
          <div key=${skill.id} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
            <div class="flex items-start justify-between mb-1">
              <div class="font-medium text-base text-slate-100 font-mono">
                ${skill.display_title || skill.id}
              </div>
              <button
                onClick=${() => handleGetSkill(skill.id)}
                class="px-2 py-1 text-xs font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
              >
                View →
              </button>
            </div>
            <div class="text-sm text-amber-400 font-mono mb-2">${skill.id}</div>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span class="text-slate-500">Source:</span>
                <span class="text-mint-400 ml-1">${skill.source || 'custom'}</span>
              </div>
              <div>
                <span class="text-slate-500">Created:</span>
                <span class="text-slate-300 ml-1">${new Date(skill.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        `)}
        ${skillsList.has_more && html`
          <div class="text-sm text-slate-500 text-center py-2 font-mono">
            More skills available (use pagination)
          </div>
        `}
      `}

      ${skillDetail && skillDetail.type !== 'skill_deleted' && !skillsList && html`
        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-slate-100 mb-3 font-mono">Skill Details</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400 font-mono">ID:</span>
              <span class="font-mono text-amber-400 truncate ml-2">${skillDetail.id}</span>
            </div>
            ${skillDetail.display_title && html`
              <div class="flex justify-between">
                <span class="text-slate-400 font-mono">Title:</span>
                <span class="font-mono text-slate-100">${skillDetail.display_title}</span>
              </div>
            `}
            <div class="flex justify-between">
              <span class="text-slate-400 font-mono">Source:</span>
              <span class="font-mono text-mint-400">${skillDetail.source || 'custom'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400 font-mono">Created:</span>
              <span class="font-mono text-slate-300">${new Date(skillDetail.created_at).toLocaleString()}</span>
            </div>
            ${skillDetail.updated_at && html`
              <div class="flex justify-between">
                <span class="text-slate-400 font-mono">Updated:</span>
                <span class="font-mono text-slate-300">${new Date(skillDetail.updated_at).toLocaleString()}</span>
              </div>
            `}
          </div>
        </div>
      `}

      ${skillDetail && skillDetail.type === 'skill_deleted' && html`
        <div class="bg-mint-900/20 border border-mint-700/50 rounded-lg p-4 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-mint-400 mb-2 font-mono flex items-center gap-2">
            <span>✓</span> Skill Deleted
          </h3>
          <p class="text-sm text-mint-300 font-mono">
            Skill ${skillDetail.id} has been permanently deleted.
          </p>
        </div>
      `}
    </div>
  `;
}

export default SkillsResponseView;
