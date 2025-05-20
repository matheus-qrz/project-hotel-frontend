import type { IEmployee, ICreateEmployeeData } from '@/services/employee/types';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
        'ADMIN': 'Administrador',
        'MANAGER': 'Gerente',
        'ATTENDANT': 'Atendente'
    };
    return roleMap[role] || role;
};

export async function getEmployeesByRestaurant(restaurantId: string, token: string): Promise<IEmployee[]> {
    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/employees`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar funcionários');
    }

    return response.json();
}

export async function getEmployeesByUnit(unitId: string, token: string): Promise<IEmployee[]> {
    const response = await fetch(`${API_URL}/unit/${unitId}/employees`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar funcionários da unidade');
    }

    return response.json();
}

export async function getEmployeeById(id: string, token: string): Promise<IEmployee> {
    const response = await fetch(`${API_URL}/users/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar funcionário');
    }

    return response.json();
}

export async function createEmployee(
    employeeData: ICreateEmployeeData,
    restaurantId: string,
    token: string
): Promise<IEmployee> {
    const response = await fetch(`${API_URL}/restaurant/${restaurantId}/employee/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            ...employeeData,
            id: employeeData.unitId || restaurantId
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao criar funcionário');
    }

    return response.json();
}

export async function updateEmployee(
    id: string,
    data: Partial<ICreateEmployeeData>,
    token: string
): Promise<IEmployee> {
    const response = await fetch(`${API_URL}/users/${id}/edit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar funcionário');
    }

    return response.json();
}

export async function deleteEmployee(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${id}/delete`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir funcionário');
    }
}