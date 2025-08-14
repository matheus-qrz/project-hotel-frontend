export const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
        'ADMIN': 'Administrador',
        'MANAGER': 'Gerente',
        'ATTENDANT': 'Atendente'
    };
    return roleMap[role] || role;
};