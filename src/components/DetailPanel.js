export class DetailPanel {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
    }

    update(node) {
        if (!node) {
            this.element.innerHTML = '<p class="text-slate-500 text-sm">Select a node to view details</p>';
            return;
        }

        this.element.innerHTML = `
      <div class="flex flex-col w-full">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold uppercase tracking-widest text-blue-400">${node.type}</span>
          ${node.weighting ? `<span class="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">WEIGHT: ${node.weighting}</span>` : ''}
        </div>
        <h3 class="font-outfit font-bold text-white truncate mb-1">${node.fullName || node.name}</h3>
        <p class="text-slate-400 text-xs line-clamp-2 leading-relaxed">
          ${node.description || 'No description available.'}
        </p>
      </div>
    `;
    }
}
