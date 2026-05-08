import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function FileMetaCard({ file }) {
  return html`
    <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
      <h3 class="text-sm font-semibold text-slate-100 mb-3 font-mono">File Details</h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between gap-2">
          <span class="text-slate-400 font-mono">ID:</span>
          <span class="font-mono text-amber-400 truncate">${file.id}</span>
        </div>
        <div class="flex justify-between gap-2">
          <span class="text-slate-400 font-mono">Filename:</span>
          <span class="font-mono text-slate-100 truncate">${file.filename || '—'}</span>
        </div>
        <div class="flex justify-between gap-2">
          <span class="text-slate-400 font-mono">MIME type:</span>
          <span class="font-mono text-slate-300">${file.mime_type || '—'}</span>
        </div>
        <div class="flex justify-between gap-2">
          <span class="text-slate-400 font-mono">Size:</span>
          <span class="font-mono text-mint-400">${formatBytes(file.size_bytes)}</span>
        </div>
        <div class="flex justify-between gap-2">
          <span class="text-slate-400 font-mono">Created:</span>
          <span class="font-mono text-slate-300">${formatDate(file.created_at)}</span>
        </div>
        <div class="flex justify-between gap-2">
          <span class="text-slate-400 font-mono">Downloadable:</span>
          <span class="font-mono ${file.downloadable ? 'text-mint-400' : 'text-slate-500'}">${file.downloadable ? 'yes' : 'no'}</span>
        </div>
      </div>
    </div>
  `;
}

export function FilesResponseView({ filesList, fileDetail, handleGetFile, handleDeleteFile, handleDownloadFile }) {
  if (!filesList && !fileDetail) return null;

  return html`
    <div class="space-y-3 animate-slide-up">
      ${filesList && html`
        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-3 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-slate-100 font-mono">
            Found ${filesList.data?.length || 0} files
          </h3>
        </div>
        ${filesList.data?.map((file) => html`
          <div key=${file.id} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="font-medium text-base text-slate-100 font-mono truncate">
                ${file.filename || file.id}
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  onClick=${() => handleGetFile && handleGetFile(file.id)}
                  class="px-2 py-1 text-xs font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
                >Get</button>
                <button
                  onClick=${() => handleDownloadFile && handleDownloadFile(file.id, file.filename || file.id)}
                  disabled=${!file.downloadable}
                  class="px-2 py-1 text-xs font-mono rounded transition-colors ${file.downloadable ? 'text-mint-400 hover:text-mint-300 hover:bg-mint-500/10' : 'text-slate-600 cursor-not-allowed'}"
                  title=${file.downloadable ? 'Download file content' : 'User-uploaded files cannot be downloaded'}
                >Download</button>
                <button
                  onClick=${() => handleDeleteFile && handleDeleteFile(file.id)}
                  class="px-2 py-1 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >Delete</button>
              </div>
            </div>
            <div class="text-sm text-amber-400 font-mono mb-2 truncate">${file.id}</div>
            <div class="grid grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span class="text-slate-500">Size:</span>
                <span class="text-mint-400 ml-1">${formatBytes(file.size_bytes)}</span>
              </div>
              <div class="truncate">
                <span class="text-slate-500">Type:</span>
                <span class="text-slate-300 ml-1">${file.mime_type || '—'}</span>
              </div>
              <div>
                <span class="text-slate-500">Created:</span>
                <span class="text-slate-300 ml-1">${file.created_at ? new Date(file.created_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        `)}
        ${filesList.has_more && html`
          <div class="text-sm text-slate-500 text-center py-2 font-mono">
            More files available (use pagination)
          </div>
        `}
      `}

      ${fileDetail && fileDetail.type === 'file_deleted' && html`
        <div class="bg-mint-900/20 border border-mint-700/50 rounded-lg p-4 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-mint-400 mb-2 font-mono flex items-center gap-2">
            <span>✓</span> File Deleted
          </h3>
          <p class="text-sm text-mint-300 font-mono">
            File ${fileDetail.id} has been permanently deleted.
          </p>
        </div>
      `}

      ${fileDetail && fileDetail.type !== 'file_deleted' && !filesList && html`<${FileMetaCard} file=${fileDetail} />`}
    </div>
  `;
}

export default FilesResponseView;
