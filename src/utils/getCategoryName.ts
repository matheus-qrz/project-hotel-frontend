const CATEGORIES = [
    { id: "appetizers", name: "Entradas" },
    { id: "main", name: "Pratos Principais" },
    { id: "desserts", name: "Sobremesas" },
    { id: "drinks", name: "Bebidas" },
    { id: "sides", name: "Acompanhamentos" },
];

export const getCategoryName = (categoryId: string) => {
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
};
