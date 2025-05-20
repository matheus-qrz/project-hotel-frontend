import { create } from 'zustand';
import type { IEmployee, ICreateEmployeeData } from '@/services/employee/types';
import type { IRestaurantUnit } from '@/services/restaurant/types';
import {
    getEmployeesByRestaurant,
    createEmployee,
    updateEmployee,
    deleteEmployee
} from '@/services/employee';

interface EmployeeState {
    employees: IEmployee[];
    units: IRestaurantUnit[];
    isLoading: boolean;
    error: string | null;
    fetchEmployees: (restaurantId: string, token: string) => Promise<void>;
    setUnits: (units: IRestaurantUnit[]) => void;
    addEmployee: (employeeData: ICreateEmployeeData, restaurantId: string, token: string) => Promise<void>;
    updateEmployee: (employeeId: string, employeeData: Partial<ICreateEmployeeData>, token: string) => Promise<void>;
    deleteEmployee: (employeeId: string, token: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
    employees: [],
    units: [],
    isLoading: false,
    error: null,

    fetchEmployees: async (restaurantId: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
            const employees = await getEmployeesByRestaurant(restaurantId, token);
            set({ employees, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erro ao carregar funcionários',
                isLoading: false
            });
            throw error;
        }
    },

    setUnits: (units: IRestaurantUnit[]) => {
        set({ units });
    },

    addEmployee: async (employeeData: ICreateEmployeeData, restaurantId: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
            const newEmployee = await createEmployee(employeeData, restaurantId, token);
            set((state) => ({
                employees: [...state.employees, newEmployee],
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erro ao adicionar funcionário',
                isLoading: false
            });
            throw error;
        }
    },

    updateEmployee: async (employeeId: string, employeeData: Partial<ICreateEmployeeData>, token: string) => {
        set({ isLoading: true, error: null });
        try {
            const updatedEmployee = await updateEmployee(employeeId, employeeData, token);
            set((state) => ({
                employees: state.employees.map(emp =>
                    emp._id === employeeId ? updatedEmployee : emp
                ),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erro ao atualizar funcionário',
                isLoading: false
            });
            throw error;
        }
    },

    deleteEmployee: async (employeeId: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
            await deleteEmployee(employeeId, token);
            set((state) => ({
                employees: state.employees.filter(emp => emp._id !== employeeId),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erro ao excluir funcionário',
                isLoading: false
            });
            throw error;
        }
    }
}));