// stores/hotelFormStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Dados do administrador (ADMIN)
interface AdminData {
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// Endereço do hotel
interface HotelAddress {
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
}

// Contato do hotel
interface HotelContact {
  phone: string;
  email: string;
}

// Dados do hotel
interface HotelData {
  name: string;
  description: string;
  logo: string;
  address: HotelAddress;
  contact: HotelContact;
}

// Interface principal do formulário
interface HotelFormData {
  admin: AdminData;
  hotel: HotelData;
}

interface HotelFormState {
  formData: HotelFormData;
  currentStep: number;
  updateAdmin: (data: Partial<AdminData>) => void;
  updateHotel: (data: Partial<HotelData>) => void;
  updateHotelAddress: (data: Partial<HotelAddress>) => void;
  updateHotelContact: (data: Partial<HotelContact>) => void;
  setFormStep: (step: number) => void;
  resetForm: () => void;
}

const initialFormData: HotelFormData = {
  admin: {
    firstName: '',
    lastName: '',
    cpf: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  },
  hotel: {
    name: '',
    description: '',
    logo: '',
    address: {
      street: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      zipCode: '',
    },
    contact: {
      phone: '',
      email: '',
    },
  },
};

export const useHotelFormStore = create<HotelFormState>()(
  persist(
    (set) => ({
      formData: { ...initialFormData },
      currentStep: 1,

      updateAdmin: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            admin: { ...state.formData.admin, ...data },
          },
        })),

      updateHotel: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            hotel: { ...state.formData.hotel, ...data },
          },
        })),

      updateHotelAddress: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            hotel: {
              ...state.formData.hotel,
              address: { ...state.formData.hotel.address, ...data },
            },
          },
        })),

      updateHotelContact: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            hotel: {
              ...state.formData.hotel,
              contact: { ...state.formData.hotel.contact, ...data },
            },
          },
        })),

      setFormStep: (step) => set({ currentStep: step }),

      resetForm: () =>
        set({
          formData: {
            admin: { ...initialFormData.admin },
            hotel: {
              ...initialFormData.hotel,
              address: { ...initialFormData.hotel.address },
              contact: { ...initialFormData.hotel.contact },
            },
          },
          currentStep: 1,
        }),
    }),
    {
      name: 'hotel-form-storage',
    }
  )
);