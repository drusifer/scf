export class RegimeCatalog {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.regimes = [];
        this.selected = new Set(['NIST CSF 2.0']); // Default as per PRD
        this.onToggle = null;
        this.colors = {};
    }

    render(regimes) {
        this.regimes = regimes;
        this.generateColors();
        this.updateDisplay();
    }

    generateColors() {
        const rainbow = [
            '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
            '#06b6d4', '#84cc16', '#fb923c', '#6366f1'
        ];
        this.regimes.forEach((regime, i) => {
            this.colors[regime] = rainbow[i % rainbow.length];
        });
    }

    updateDisplay() {
        this.element.innerHTML = this.regimes.map(regime => `
      <label class="flex items-center space-x-3 p-2 rounded hover:bg-white/5 cursor-pointer group transition-colors">
        <div class="relative flex items-center">
          <input 
            type="checkbox" 
            class="form-checkbox h-4 w-4 bg-transparent border-white/20 rounded focus:ring-offset-slate-900"
            ${this.selected.has(regime) ? 'checked' : ''}
            data-regime="${regime}"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-300 group-hover:text-white truncate">${regime}</p>
        </div>
        ${this.selected.has(regime) ? `
          <div class="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style="background-color: ${this.colors[regime]}"></div>
        ` : ''}
      </label>
    `).join('');

        this.setupListeners();
    }

    setupListeners() {
        this.element.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const regime = e.target.dataset.regime;
                if (e.target.checked) {
                    this.selected.add(regime);
                } else {
                    this.selected.delete(regime);
                }
                this.updateDisplay();
                if (this.onToggle) this.onToggle(Array.from(this.selected));
            });
        });
    }
}
