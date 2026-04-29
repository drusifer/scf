import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOT_DIR = path.join(__dirname, "screenshots");

async function shot(page, name) {
    const file = path.join(SHOT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    return file;
}

async function waitForViz(page) {
    await page.waitForSelector("#viz-container svg", { timeout: 20000 });
    await page.waitForFunction(
        () => document.getElementById("framework-badge")?.textContent?.trim().length > 0,
        { timeout: 20000 }
    );
    await page.waitForTimeout(800);
}

test.beforeAll(() => {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
});

test("01 — initial load (light mode)", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    await expect(page.locator("#viz-container svg")).toBeVisible();
    await shot(page, "01-initial-light");
});

test("02 — dark mode", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    await page.locator("#theme-select").selectOption("dark");
    await page.waitForTimeout(400);

    await expect(page.locator("html")).toHaveClass(/dark/);
    await shot(page, "02-dark-mode");
});

test("03 — framework selector", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    // US-UX-6 AC5: framework buttons must have a non-empty title attribute
    const buttons = page.locator("#framework-selector .framework-btn");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
        await expect(buttons.nth(i)).toHaveAttribute("title", /.+/);
    }

    // US-S6-1 AC6: regime label matches active framework (SCF default = "Compliance Regimes")
    await expect(page.locator("#regime-label")).toContainText("Compliance Regimes");

    await page.locator("#framework-selector").scrollIntoViewIfNeeded();
    await shot(page, "03-framework-selector");
});

test("04 — framework switch (second option)", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const buttons = page.locator("#framework-selector .framework-btn");
    const count = await buttons.count();

    if (count > 1) {
        await buttons.nth(1).click();
        await page.waitForFunction(
            () => !document.getElementById("framework-loading")?.classList.contains("hidden") === false,
            { timeout: 15000 }
        ).catch(() => {});
        await waitForViz(page);

        // US-S6-1 AC6: regime label updates to CRI's "Mapped Frameworks" after switch
        await expect(page.locator("#regime-label")).toContainText("Mapped Frameworks");

        await shot(page, "04-framework-switched");
    } else {
        test.skip();
    }
});

test("05 — tag filter panel", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const tagContainer = page.locator("#tag-filter-container");
    const isVisible = await tagContainer.isVisible();
    if (!isVisible) {
        // Tag accordion may be hidden (e.g. SCF has tag_cols: []).
        // Only try to expand if the accordion header itself is visible.
        const headers = page.locator(".accordion-header");
        const count = await headers.count();
        for (let i = 0; i < count; i++) {
            const header = headers.nth(i);
            const text = await header.textContent();
            if (text && text.toLowerCase().includes("tag") && await header.isVisible()) {
                await header.click();
                await page.waitForTimeout(400);
                break;
            }
        }
    }

    // Screenshot reflects current framework state (hidden for SCF, visible for CRI)
    await shot(page, "05-tag-filter-panel");
});

test("06 — regime treeselect open", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const treeInput = page.locator("#treeselect-container .treeselect-input");
    await treeInput.click();
    await page.waitForTimeout(500);

    await shot(page, "06-regime-treeselect-open");
});

test("07 — node click detail panel", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    // Try clicking a leaf node (deepest circle)
    const nodes = page.locator("#viz-container svg circle.node");
    const count = await nodes.count();
    if (count > 0) {
        await nodes.nth(count - 1).click({ force: true });
        await page.waitForTimeout(600);
    }

    await shot(page, "07-node-clicked");
});

test("08 — left sidebar collapsed", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const toggleBtn = page.locator("#left-sidebar button").first();
    await toggleBtn.click();
    await page.waitForTimeout(400);

    await shot(page, "08-sidebar-collapsed");
});

test("09 — dark mode with regime selected", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    await page.locator("#theme-select").selectOption("dark");
    await page.waitForTimeout(300);

    const treeInput = page.locator("#treeselect-container .treeselect-input");
    await treeInput.click();
    await page.waitForTimeout(300);

    const firstOption = page.locator(".treeselect-list .treeselect-list__item").first();
    if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(600);
    }

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    await shot(page, "09-dark-regime-selected");
});

test("10 — size-by uniform", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    await page.locator("#size-by-select").selectOption("uniform");
    await page.waitForTimeout(800);

    await shot(page, "10-size-by-uniform");
});

test("11 — node hover tooltip", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    // US-S6-4 AC8: tooltip appears on node mouseover, hidden initially
    const tooltip = page.locator("#node-tooltip");
    await expect(tooltip).toHaveCSS("display", "none");

    // Hover a leaf node — use force:true since SVG circles overlap in the packed layout
    const nodes = page.locator("#viz-container svg circle.node");
    const count = await nodes.count();
    await nodes.nth(count - 1).hover({ force: true });
    await page.waitForTimeout(100);

    await expect(tooltip).not.toHaveCSS("display", "none");
    // Tooltip text must be non-empty
    const text = await tooltip.textContent();
    expect(text.trim().length).toBeGreaterThan(0);

    // S7-2: white-space:nowrap must NOT be present — tooltip wraps at max-w-xs
    const tooltipStyle = await page.locator("#node-tooltip").getAttribute("style");
    expect(tooltipStyle).not.toContain("white-space");

    await shot(page, "11-node-tooltip-hover");
});

async function switchToCRI(page) {
    const buttons = page.locator("#framework-selector .framework-btn");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        const fw = await btn.getAttribute("data-fw");
        if (fw === "cri") {
            await btn.click();
            await page.waitForFunction(
                () => !document.getElementById("framework-loading")?.classList.contains("hidden") === false,
                { timeout: 15000 }
            ).catch(() => {});
            await waitForViz(page);
            return true;
        }
    }
    return false;
}

async function selectFirstVisibleRegimeItem(page) {
    const treeInput = page.locator("#treeselect-container .treeselect-input");
    await treeInput.click();
    await page.waitForTimeout(400);

    const items = page.locator(".treeselect-list .treeselect-list__item:not(.treeselect-list__item--hidden)");
    const count = await items.count();
    if (count === 0) return false;

    await items.first().click({ force: true });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    return true;
}

async function selectVisibleRegimeByTitle(page, title) {
    const treeInput = page.locator("#treeselect-container .treeselect-input");
    await treeInput.click();
    await page.waitForTimeout(400);

    const item = page.locator(`.treeselect-list .treeselect-list__item[title="${title}"]:not(.treeselect-list__item--hidden)`);
    if (await item.count() === 0) return false;

    await item.first().click({ force: true });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    return true;
}

async function expectInsideViewport(page, locator) {
    const box = await locator.boundingBox();
    expect(box).toBeTruthy();
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

test("12 — S7-3: CRI regime list groups FFIEC frameworks", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const hasCRI = await switchToCRI(page);
    if (!hasCRI) { test.skip(); return; }

    // Open the treeselect dropdown
    const treeInput = page.locator("#treeselect-container .treeselect-input");
    await treeInput.click();
    await page.waitForTimeout(500);

    // The FFIEC group node should appear as a list item with text "FFIEC"
    const listItems = page.locator(".treeselect-list .treeselect-list__item");
    const texts = await listItems.allTextContents();
    const hasFFIEC = texts.some(t => t.trim() === "FFIEC");
    expect(hasFFIEC).toBeTruthy();

    await shot(page, "12-cri-regime-grouping");
});

test("13 — S7-5: Mapping Quality section appears on single-regime CRI select", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const hasCRI = await switchToCRI(page);
    if (!hasCRI) { test.skip(); return; }

    // Open treeselect and pick a LEAF item (group="false" — not a group node)
    const treeInput = page.locator("#treeselect-container .treeselect-input");
    await treeInput.click();
    await page.waitForTimeout(400);

    // Flat leaf at level="0" — not a child of a collapsed group; group="false" and level="0"
    const leafItems = page.locator(".treeselect-list .treeselect-list__item[group=\"false\"][level=\"0\"]");
    const count = await leafItems.count();
    if (count === 0) { test.skip(); return; }

    await leafItems.first().click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);

    // Mapping Quality section should be visible when exactly 1 regime selected
    const mqSection = page.locator("#mapping-quality-section");
    await expect(mqSection).not.toHaveClass(/hidden/);

    await shot(page, "13-mapping-quality-section");
});

test("14 — S7-1: CRI tag filter OR — selecting a tag yields non-zero results", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const hasCRI = await switchToCRI(page);
    if (!hasCRI) { test.skip(); return; }

    // Open tag filter accordion if needed
    const tagContent = page.locator("#tag-filter-container");
    if (!await tagContent.isVisible()) {
        const headers = page.locator(".accordion-header");
        const hCount = await headers.count();
        for (let i = 0; i < hCount; i++) {
            const h = headers.nth(i);
            const t = await h.textContent();
            if (t && t.toLowerCase().includes("tag") && await h.isVisible()) {
                await h.click();
                await page.waitForTimeout(400);
                break;
            }
        }
    }

    // Scroll tag filter container into view so treeselect list doesn't overlap
    await page.locator("#tag-filter-container").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const checkboxes = page.locator(".tag-checkbox");
    const cbCount = await checkboxes.count();
    if (cbCount === 0) { test.skip(); return; }

    // Click the label (which wraps the checkbox) — avoids treeselect interception
    const firstCheckbox = checkboxes.first();
    const label = firstCheckbox.locator("xpath=ancestor::label");
    const labelCount = await label.count();
    if (labelCount > 0) {
        await label.first().click({ force: true });
    } else {
        await firstCheckbox.click({ force: true });
    }
    await page.waitForTimeout(400);

    // Zero-result overlay must NOT be visible — OR semantics guarantee at least 1 match
    const overlay = page.locator("#tag-zero-result");
    if (await overlay.count() > 0) {
        await expect(overlay).toBeHidden();
    }

    await shot(page, "14-cri-tag-filter-or");
});

test("15 — S8-2: activity badge counts regimes and mapping quality filters", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const hasCRI = await switchToCRI(page);
    if (!hasCRI) { test.skip(); return; }

    const badge = page.locator("#tag-filter-badge");
    await expect(badge).toHaveClass(/hidden/);

    const selected = await selectVisibleRegimeByTitle(page, "MAS CHN AND TRMG");
    if (!selected) { test.skip(); return; }

    await expect(badge).not.toHaveClass(/hidden/);
    await expect(badge).toHaveText("1");
    await expect(badge).toHaveAttribute("aria-label", /1 active context item: 1 regime, 0 tag filters, 0 mapping quality filters/);

    const mqCheckboxes = page.locator("#mapping-quality-section input[type=\"checkbox\"]");
    const mqCount = await mqCheckboxes.count();
    if (mqCount === 0) { test.skip(); return; }

    await mqCheckboxes.first().check({ force: true });
    await expect(badge).toHaveText("2");
    await expect(badge).toHaveAttribute("aria-label", /2 active context items: 1 regime, 0 tag filters, 1 mapping quality filter/);

    await page.evaluate(() => window.clearTagFilters());
    await expect(badge).toHaveText("1");
    await expect(badge).toHaveAttribute("aria-label", /1 active context item: 1 regime, 0 tag filters, 0 mapping quality filters/);
});

test("16 — S8-3: sidebar toggle labels update with state", async ({ page }) => {
    await page.goto("/");
    await waitForViz(page);

    const leftHandle = page.locator("#left-sidebar > button.sidebar-handle");
    const rightHandle = page.locator("#right-sidebar > button.sidebar-handle");

    await expect(leftHandle).toHaveAttribute("aria-label", "Collapse filters sidebar");
    await expect(leftHandle).toHaveAttribute("title", "Collapse filters sidebar");
    await leftHandle.click();
    await expect(leftHandle).toHaveAttribute("aria-label", "Expand filters sidebar");
    await expect(leftHandle).toHaveAttribute("title", "Expand filters sidebar");

    await expect(rightHandle).toHaveAttribute("aria-label", "Expand details panel");
    await expect(rightHandle).toHaveAttribute("title", "Expand details panel");
    await rightHandle.click();
    await expect(rightHandle).toHaveAttribute("aria-label", "Collapse details panel");
    await expect(rightHandle).toHaveAttribute("title", "Collapse details panel");
});

test("17 — S8-4: regime legend stays within viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForViz(page);

    const selected = await selectFirstVisibleRegimeItem(page);
    if (!selected) { test.skip(); return; }

    const legend = page.locator("#regime-legend");
    await expect(legend.locator("> div").first()).toBeVisible();
    await expectInsideViewport(page, legend);

    await page.locator("#theme-select").selectOption("dark");
    await page.waitForTimeout(400);
    await expectInsideViewport(page, legend);
});
