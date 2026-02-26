// stores/hotelStore.ts
import { create } from "zustand";
import { useAuthStore } from "../auth";

// types/hotel.ts
export interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Contact {
  phone: string;
  email: string;
}

export interface Room {
  roomId: string;
  displayName: string;
  floor?: string;
  sector?: string;
  isActive: boolean;
  qrCode?: string;
}

export interface HotelUnit {
  _id: string;
  hotel: string;
  name: string;
  description?: string;
  roomNumberingFormat: "SIMPLE" | "FLOOR_ROOM" | "SECTOR_ROOM";
  rooms: Room[];
  orders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  address: Address;
  contact: Contact;
  owner: string;
  units: HotelUnit[];
  createdAt: string;
  updatedAt: string;
}

interface HotelStore {
  hotel: Hotel | null;
  isLoading: boolean;
  error: string | null;

  // Ações básicas
  fetchHotelData: (slug: string) => Promise<void>;
  updateHotelInfo: (data: Partial<Hotel>) => Promise<void>;

  // Ações específicas
  updateAddress: (address: Address) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;

  // Gerenciamento de unidades
  createUnit: (unitData: {
    name: string;
    description?: string;
    roomNumberingFormat?: "SIMPLE" | "FLOOR_ROOM" | "SECTOR_ROOM";
  }) => Promise<HotelUnit | null>;

  // Gerenciamento de quartos
  addRoomsToUnit: (unitId: string, rooms: Omit<Room, "isActive" | "qrCode">[]) => Promise<void>;
  generateQRCodes: (unitId: string, roomIds: string[]) => Promise<{ roomId: string; qrCodeUrl: string; qrCodeDataUrl: string }[]>;
  listUnitRooms: (unitId: string) => Promise<{ unitName: string; roomNumberingFormat: string; rooms: Room[] } | null>;

  // Utilitários
  getUnitById: (unitId: string) => HotelUnit | null;
  getRoomByIdInUnit: (unitId: string, roomId: string) => Room | null;
  getAllRooms: () => Room[];
  getActiveRooms: () => Room[];
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const useHotelStore = create<HotelStore>((set, get) => ({
  hotel: null,
  isLoading: false,
  error: null,

  fetchHotelData: async (slug: string) => {
    try {
      set({ isLoading: true, error: null });

      const cleanSlug = slug.split("?")[0];

      const response = await fetch(`${API_URL}/hotel/by-slug/${cleanSlug}`, {
        headers: {
          ...useAuthStore.getState().getHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar dados do hotel");
      }

      const data = await response.json();
      set({ hotel: data });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateHotelInfo: async (data: Partial<Hotel>) => {
    const { hotel } = get();
    if (!hotel) return;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`${API_URL}/hotel/${hotel._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...useAuthStore.getState().getHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao atualizar dados do hotel");
      }

      const updatedData = await response.json();
      set({ hotel: { ...hotel, ...updatedData } });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAddress: async (address: Address) => {
    await get().updateHotelInfo({ address });
  },

  updateContact: async (contact: Contact) => {
    await get().updateHotelInfo({ contact });
  },

  createUnit: async (unitData) => {
    const { hotel } = get();
    if (!hotel) return null;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`${API_URL}/hotel/${hotel._id}/unit/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...useAuthStore.getState().getHeaders(),
        },
        body: JSON.stringify(unitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao criar unidade");
      }

      const newUnit = await response.json();

      // Atualiza o hotel local com a nova unidade
      set({
        hotel: {
          ...hotel,
          units: [...hotel.units, newUnit],
        },
      });

      return newUnit;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addRoomsToUnit: async (unitId: string, rooms) => {
    const { hotel } = get();
    if (!hotel) return;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`${API_URL}/hotel/unit/${unitId}/rooms/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...useAuthStore.getState().getHeaders(),
        },
        body: JSON.stringify({ rooms }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao adicionar quartos");
      }

      const updatedUnit = await response.json();

      // Atualiza a unidade no hotel local
      set({
        hotel: {
          ...hotel,
          units: hotel.units.map((unit) =>
            unit._id === unitId ? updatedUnit : unit
          ),
        },
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  generateQRCodes: async (unitId: string, roomIds: string[]) => {
    const { hotel } = get();
    if (!hotel) return [];

    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`${API_URL}/hotel/unit/${unitId}/qrcodes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...useAuthStore.getState().getHeaders(),
        },
        body: JSON.stringify({ roomIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao gerar QR Codes");
      }

      const data = await response.json();

      // Atualiza os quartos com os QR Codes no estado local
      set({
        hotel: {
          ...hotel,
          units: hotel.units.map((unit) => {
            if (unit._id !== unitId) return unit;

            return {
              ...unit,
              rooms: unit.rooms.map((room) => {
                const qrData = data.qrCodes.find(
                  (qr: any) => qr.roomId === room.roomId
                );
                if (qrData) {
                  return { ...room, qrCode: qrData.qrCodeUrl };
                }
                return room;
              }),
            };
          }),
        },
      });

      return data.qrCodes;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  listUnitRooms: async (unitId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`${API_URL}/hotel/unit/${unitId}/rooms`, {
        headers: {
          ...useAuthStore.getState().getHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao listar quartos");
      }

      return await response.json();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Utilitários
  getUnitById: (unitId: string) => {
    const { hotel } = get();
    if (!hotel) return null;

    return hotel.units.find((unit) => unit._id === unitId) || null;
  },

  getRoomByIdInUnit: (unitId: string, roomId: string) => {
    const unit = get().getUnitById(unitId);
    if (!unit) return null;

    return unit.rooms.find((room) => room.roomId === roomId) || null;
  },

  getAllRooms: () => {
    const { hotel } = get();
    if (!hotel) return [];

    return hotel.units.flatMap((unit) => unit.rooms);
  },

  getActiveRooms: () => {
    return get().getAllRooms().filter((room) => room.isActive);
  },
}));