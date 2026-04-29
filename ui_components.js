/**
 * UI Component logic for sidebars, breadcrumbs, and alerts.
 */
export const UIComponents = {
    toggleSidebar(side, handleResize) {
        const isLeft = side === "left";
        const sidebar = document.getElementById(isLeft ? "left-sidebar" : "right-sidebar");
        const icon = document.getElementById(isLeft ? "left-toggle-icon" : "right-toggle-icon");
        const main = document.querySelector("main");

        if (isLeft) {
            sidebar.classList.toggle("collapsed");
            const isCollapsed = sidebar.classList.contains("collapsed");
            icon.innerText = isCollapsed ? "▶" : "◀";
            main.classList.toggle("left-collapsed", isCollapsed);
        } else {
            sidebar.classList.toggle("open");
            const isOpen = sidebar.classList.contains("open");
            icon.innerText = isOpen ? "▶" : "◀";
            main.classList.toggle("right-open", isOpen);
        }

        this.updateSidebarToggleA11y(side);

        if (handleResize) {
            setTimeout(handleResize, 400);
        }
    },

    updateSidebarToggleA11y(side) {
        const isLeft = side === "left";
        const sidebar = document.getElementById(isLeft ? "left-sidebar" : "right-sidebar");
        const button = sidebar?.querySelector(".sidebar-handle");
        if (!button || !sidebar) return;

        const collapsed = isLeft
            ? sidebar.classList.contains("collapsed")
            : !sidebar.classList.contains("open");
        const label = isLeft
            ? (collapsed ? "Expand filters sidebar" : "Collapse filters sidebar")
            : (collapsed ? "Expand details panel" : "Collapse details panel");
        button.setAttribute("title", label);
        button.setAttribute("aria-label", label);
    },

    updateBreadcrumbs(d, zoomCallback) {
        const crumb = document.getElementById("breadcrumbs");
        if (!d || !crumb) return;

        const collapsed = d.ancestors().reverse().reduce((acc, node) => {
            const label = node.data.name.split(":")[0];
            if (acc.length > 0 && acc[acc.length - 1].label === label) return acc;
            acc.push({ node, label });
            return acc;
        }, []);

        crumb.innerHTML = "";
        collapsed.forEach(({ node, label }, index) => {
            const isLast = index === collapsed.length - 1;
            const span = document.createElement("span");
            span.textContent = label;
            span.className = isLast
                ? "font-bold text-slate-900 dark:text-white"
                : "cursor-pointer hover:text-blue-500 transition-colors duration-200 text-slate-500 dark:text-slate-400";

            if (!isLast) {
                span.onclick = (event) => {
                    event.stopPropagation();
                    zoomCallback(event, node);
                };
            }

            crumb.appendChild(span);

            if (!isLast) {
                const separator = document.createElement("span");
                separator.className = "mx-1 opacity-30 text-gray-500 dark:text-gray-400";
                separator.textContent = "/";
                crumb.appendChild(separator);
            }
        });
    },

    showToast(msg) {
        const toast = document.createElement("div");
        toast.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--sidebar-color)] border border-[var(--border-muted)] text-[var(--text-primary)] text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none";
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    showVizError(msg) {
        const container = document.getElementById("viz-container");
        if (!container) return;
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-sm text-[var(--text-muted)]">${msg}</div>`;
    },

    updateReadingViewUI(isReadingView) {
        const status = document.getElementById("reading-view-status");
        const indicator = document.getElementById("reading-view-indicator");
        const labelText = document.getElementById("reading-view-label");
        const button = document.getElementById("return-to-reading-view");

        if (!status || !indicator || !labelText || !button) return;

        status.classList.toggle("border-amber-500/30", !isReadingView);
        status.classList.toggle("text-amber-700", !isReadingView);
        status.classList.toggle("dark:text-amber-300", !isReadingView);
        indicator.classList.toggle("bg-emerald-500", isReadingView);
        indicator.classList.toggle("bg-amber-500", !isReadingView);
        labelText.textContent = isReadingView ? "Reading View" : "Free Zoom View";
        button.classList.toggle("hidden", isReadingView);
    }
};
