export class Sidebar {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.onSelect = null;
  }

  render(hierarchy) {
    this.element.innerHTML = `
      <h2 class="font-outfit text-xl font-bold mb-4 tracking-tight">SCF Hierarchy</h2>
      <div id="hierarchy-nav" class="flex-1 overflow-y-auto custom-scrollbar pr-2">
        ${this.buildTree(hierarchy.children)}
      </div>
    `;
    this.setupListeners();
  }

  buildTree(nodes, indent = 0) {
    if (!nodes) return '';
    // Performance: Only render top levels or limit count
    return nodes.slice(0, 50).map(node => `
      <div class="mb-1">
        <button 
          class="w-full text-left px-2 py-1 rounded hover:bg-white/10 transition-colors text-sm flex items-center group"
          style="padding-left: ${indent * 12 + 8}px"
          data-id="${node.id}"
          data-type="${node.type}"
        >
          <span class="w-2 h-2 rounded-full mr-2 ${this.getColorClass(node.type)}"></span>
          <span class="truncate flex-1 font-medium text-slate-300 group-hover:text-white">${node.name}</span>
          ${node.children && node.children.length > 0 && indent < 1 ? '<span class="text-[10px] text-slate-500 ml-2">▸</span>' : ''}
        </button>
      </div>
    `).join('') + (nodes.length > 50 ? '<p class="text-[10px] text-slate-500 px-4 py-2">... more items available via search</p>' : '');
  }

  getColorClass(type) {
    switch (type) {
      case 'domain': return 'bg-blue-500';
      case 'pptdf': return 'bg-purple-500';
      case 'control': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  }

  setupListeners() {
    this.element.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && this.onSelect) {
        this.onSelect(btn.dataset.id, btn.dataset.type);
      }
    });
  }
}
