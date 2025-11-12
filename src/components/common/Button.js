import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'md',
  type = 'button',
  loading = false
}) {
  const baseClasses = 'font-medium font-mono rounded-lg transition-all duration-200 focus:outline-none relative overflow-hidden';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800',
    danger: 'bg-red-900/50 text-red-300 hover:bg-red-900/70 border border-red-700/50 hover:border-red-600 disabled:bg-red-900/20 disabled:text-red-700 disabled:border-red-900/30',
    ghost: 'bg-transparent text-slate-400 hover:text-amber-400 hover:bg-slate-800/50 disabled:text-slate-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return html`
    <button
      type=${type}
      onClick=${onClick}
      disabled=${disabled || loading}
      class="${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} disabled:cursor-not-allowed hover:transform hover:scale-[1.02] active:scale-[0.98]"
    >
      ${loading ? html`
        <span class="flex items-center justify-center gap-2">
          <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ${children}
        </span>
      ` : children}
    </button>
  `;
}
