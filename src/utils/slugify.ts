/**
 * Gera um slug único para um hotel/estabelecimento
 * Formato: nome-normalizado-id
 */
export const generateHotelSlug = (name: string, id: string): string => {
    if (!name || !id) {
        throw new Error('Nome e ID são obrigatórios para gerar o slug');
    }

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

/**
 * Extrai o ID do MongoDB a partir de um slug
 * Ex: "hotel-beira-mar-69949669b86fa95c3d2b0796" → "69949669b86fa95c3d2b0796"
 */
export const extractIdFromSlug = (slug: string): string => {
    return slug.split('-').pop() || '';
};

/**
 * Extrai o nome legível a partir de um slug
 * Ex: "hotel-beira-mar-69949669b86fa95c3d2b0796" → "Hotel Beira Mar"
 */
export const extractNameFromSlug = (slug: string): string => {
    if (!slug) return '';

    const parts = slug.split('-');
    const name = parts.slice(0, -1).join(' ');

    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();
};

/**
 * Retorna o escopo da rota com base no caminho do navegador
 * Adaptado para a estrutura de rotas do Roomly
 */
export function extractScopeFromPathname(pathname: string): "hotel" | "unit" {
    if (pathname.includes("/admin/hotel/")) return "hotel";
    if (pathname.includes("/admin/unit/")) return "unit";
    return "hotel"; // fallback padrão para o Roomly
}