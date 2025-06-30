const CATEGORIES = [
    { id: 'accompaniments', name: 'Acompanhamentos' },
    { id: 'appetizers', name: 'Entradas' },
    { id: 'main', name: 'Pratos Principais' },
    { id: 'pizzas', name: 'Pizzas' },
    { id: 'burgers', name: 'Hambúrgueres' },
    { id: 'pastas', name: 'Massas' },
    { id: 'grills', name: 'Grelhados' },
    { id: 'seafood', name: 'Frutos do Mar' },
    { id: 'healthy', name: 'Saudável' },
    { id: 'sides', name: 'Acompanhamentos' },
    { id: 'specials', name: 'Especiais' },
    { id: 'vegan', name: 'Vegano' },
    { id: 'gluten-free', name: 'Sem Glúten' },
    { id: 'breakfast', name: 'Café da Manhã' },
    { id: 'snacks', name: 'Lanches' },
    { id: 'snacks2', name: 'Petiscos' },
    { id: 'salads', name: 'Saladas' },
    { id: 'addOns', name: 'Adicionais' },
    { id: 'soups', name: 'Sopas' },
    { id: 'international', name: 'Internacional' },
    { id: 'kids', name: 'Menu Infantil' },
    { id: 'cocktails', name: 'Coquetéis' },
    { id: 'smoothies', name: 'Smoothies' },
    { id: 'teas', name: 'Chás' },
    { id: 'coffees', name: 'Cafés' },
    { id: 'wines', name: 'Vinhos' },
    { id: 'beers', name: 'Cervejas' },
    { id: 'spirits', name: 'Destilados' },
    { id: 'drinks', name: 'Bebidas' },
    { id: 'desserts', name: 'Sobremesas' },
];

export const getCategoryName = (categoryId: string) => {
    const category = CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
};
