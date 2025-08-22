// stores/employeeStore.ts
import { create } from 'zustand';
import { Order } from '../order';
import { RestaurantUnit } from '../restaurantUnit/restaurantUnitStore';
import { useAuthStore } from '../auth';

export type Role = "ADMIN" | "MANAGER" | "ATTENDANT";

export interface IEmployee {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: Role;
    restaurant?: string;
    restaurantUnit?: string;
    createdAt?: string;
}

export interface IRestaurantUnit {
    _id: string;
    address: {
        zipCode: string;
        street: string;
        number: number;
        complement: string;
    };
    cnpj: string;
    socialName: string;
    manager: string;
    phone: string;
    isMatrix?: boolean;
    attendants: string[] | IEmployee[];
    orders: string[] | Order[];
}

export interface ICreateEmployeeData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    role: Role;
    restaurant: string;
    restaurantUnit: string;
}


interface EmployeeState {
    employees: IEmployee[];
    units: RestaurantUnit[];
    isLoading: boolean;
    error: string | null;

    fetchEmployees: (restaurantId: string, token: string) => Promise<void>;
    fetchEmployeesByUnit: (unitId: string, token: string) => Promise<void>;
    fetchEmployeeById: (id: string, token: string) => Promise<IEmployee | null>;
    setUnits: (units: RestaurantUnit[]) => void;

    addEmployee: (employeeData: ICreateEmployeeData, restaurantId: string, token: string) => Promise<void>;
    updateEmployee: (employeeId: string, employeeData: Partial<ICreateEmployeeData>, token: string) => Promise<void>;
    deleteEmployee: (employeeId: string, token: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
    employees: [],
    units: [],
    isLoading: false,
    error: null,

    setUnits: (units: RestaurantUnit[]) => set({ units }),

    fetchEmployees: async (restaurantId, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/restaurant/${restaurantId}/employees`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error((await res.json()).message);
            const data: IEmployee[] = await res.json();
            set({ employees: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message || 'Erro ao buscar funcionários', isLoading: false });
        }
    },

    fetchEmployeesByUnit: async (unitId, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/unit/${unitId}/employees`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error((await res.json()).message);
            const data: IEmployee[] = await res.json();
            set({ employees: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message || 'Erro ao buscar funcionários da unidade', isLoading: false });
        }
    },

    fetchEmployeeById: async (id, token) => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error((await res.json()).message);
            const json = await res.json();
            return json.user;
        } catch (err) {
            set({ error: 'Erro ao buscar funcionário' });
            return null;
        }
    },

    addEmployee: async (employeeData, restaurantId, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/restaurant/${restaurantId}/employee/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...employeeData,
                    restaurant: restaurantId,
                    restaurantUnit: employeeData.restaurantUnit
                })

            });
            if (!res.ok) throw new Error((await res.json()).message);
            const newEmp = await res.json();
            set((state) => ({ employees: [...state.employees, newEmp], isLoading: false }));
        } catch (err: any) {
            set({ error: err.message || 'Erro ao adicionar funcionário', isLoading: false });
        }
    },

    updateEmployee: async (employeeId, data, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/users/${employeeId}/edit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error((await res.json()).message);
            const updated = await res.json();
            set((state) => ({
                employees: state.employees.map(emp => emp._id === employeeId ? updated : emp),
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message || 'Erro ao atualizar funcionário', isLoading: false });
        }
    },

    deleteEmployee: async (employeeId, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/users/${employeeId}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error((await res.json()).message);
            set((state) => ({
                employees: state.employees.filter(emp => emp._id !== employeeId),
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message || 'Erro ao excluir funcionário', isLoading: false });
        }
    }
}));
