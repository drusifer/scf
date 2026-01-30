export class Navbar {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.onBreadcrumbClick = null;
    }

    update(path) {
        // path: array of { id, name, type }
        this.element.innerHTML = `
      <div class="flex items-center space-x-2 text-sm font-medium">
        <button class="text-slate-400 hover:text-white transition-colors" data-index="-1">Root</button>
        ${path.map((p, i) => `
          <span class="text-slate-600">/</span>
          <button 
            class="${i === path.length - 1 ? 'text-blue-400' : 'text-slate-300 hover:text-white'} transition-colors truncate max-w-[200px]" 
            data-index="${i}"
          >
            ${p.name}
          </button>
        `).join('')}
      </div>
    `;

        this.setupListeners(path);
    }

    setupListeners(path) {
        this.element.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (this.onBreadcrumbClick) {
                    const target = index === -1 ? null : path[index];
                    this.onBreadcrumbClick(target, index);
                }
            });
        });
    }
}
