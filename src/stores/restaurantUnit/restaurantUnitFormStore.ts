// stores/restaurantUnitFormStore.ts
import { create } from 'zustand';

interface Manager {
    id: string;
    name: string;
}

interface Schedule {
    days: string[];
    opens: string;
    closes: string;
}

interface UnitFormState {
    unitData: {
        id?: string;
        cnpjPart1: string;
        cnpjPart2: string;
        cnpjPart3: string;
        socialName: string;
        name: string;
        phone: string;
        specialty: string;
        useMatrixCNPJ: boolean;
        zipCode: string;
        street: string;
        number: string;
        complement: string;
        useMatrixSchedule: boolean;
        schedules: Schedule[];
        managers: Manager[];
    };
    updateUnitData: (data: Partial<UnitFormState['unitData']>) => void;
    resetForm: () => void;
}

const initialState = {
    cnpjPart1: '',
    cnpjPart2: '',
    cnpjPart3: '',
    socialName: '',
    name: '',
    phone: '',
    specialty: '',
    useMatrixCNPJ: false,
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    useMatrixSchedule: false,
    schedules: [],
    managers: []
};

export const useRestaurantUnitFormStore = create<UnitFormState>((set) => ({
    unitData: initialState,
    updateUnitData: (data) => set((state) => ({
        unitData: { ...state.unitData, ...data }
    })),
    resetForm: () => set({ unitData: initialState })
}));