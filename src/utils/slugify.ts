export const generateRestaurantSlug = (name: string, id: string) => {
    if (!name || !id) {
        throw new Error('Nome e ID são obrigatórios para gerar o slug');
    }

    // Limpa o ID se for um ObjectId
    const cleanId = id.replace(/^ObjectId\("(.*)"\)$/, '$1');

    const normalizedName = name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `${normalizedName}-${cleanId}`;
};

export const extractIdFromSlug = (slug: string): string => {
    return slug.split('-').pop() || '';
};

export const extractNameFromSlug = (slug: string): string => {
    if (!slug) return '';

    // Remove o ID do final do slug
    const parts = slug.split('-');
    // Remove o último elemento (ID) e junta o resto
    const name = parts.slice(0, -1).join(' ');

    // Capitaliza as palavras e remove caracteres especiais
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
};