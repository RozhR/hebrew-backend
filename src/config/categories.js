export const CATEGORY_CONFIG = {
    verbs: { table: "content.verbs", maxLevel: 25, itemName: "Verb" },
    adjectives: { table: "content.adjectives", maxLevel: 25, itemName: "Adjective" },
    adverbs: { table: "content.adverbs", maxLevel: 15, itemName: "Adverb" },
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIG);

export function getCategoryConfig(category) {
    return Object.hasOwn(CATEGORY_CONFIG, category) ? CATEGORY_CONFIG[category] : null;
}
