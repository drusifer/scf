// Pure regime grouping helper — groups regimes by first-word prefix for CRI tree display.
// Regimes whose first word appears 2+ times in the list become a grouped parent node;
// singletons remain as flat leaves.
export function buildRegimeTreeOptions(regimeList) {
    const groups = new Map();
    regimeList.forEach(r => {
        const prefix = r.name.split(" ")[0];
        if (!groups.has(prefix)) groups.set(prefix, []);
        groups.get(prefix).push(r);
    });

    const options = [];
    groups.forEach((regimes, prefix) => {
        if (regimes.length >= 2) {
            options.push({
                name: prefix,
                value: `grp-${prefix}`,
                children: regimes.map(r => ({ name: r.name, value: r.id }))
            });
        } else {
            options.push({ name: regimes[0].name, value: regimes[0].id });
        }
    });
    return options.sort((a, b) => a.name.localeCompare(b.name));
}
