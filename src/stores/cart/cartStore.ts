// stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderItemStatusType } from '../order/types/order.types';
import { generateOrGetGuestId } from '@/utils/guestId';

/** ===== Tipos ===== */
interface Addon {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface GuestInfo {
  id: string;
  name?: string;
}

export interface CartItemProps {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  costPrice?: number;
  image?: string;
  status?: OrderItemStatusType;
  observations?: string;
  addons?: Addon[];
}

interface CartStore {
  /** Carrinho “compat” (reflete SEMPRE o carrinho do guest ativo) */
  items: CartItemProps[];

  /** Metadados já existentes no seu store */
  tableId: number | null;
  restaurantId: string | null;
  unitId: string | null;
  guestInfo: GuestInfo | null;
  orderType: 'local' | 'takeaway';
  observations: string;

  /** NOVO: guest ativo + mapa de carrinhos por guest */
  activeGuestId: string | null;
  cartsByGuest: Record<string, CartItemProps[]>;

  /** Controle de sessão por guest (mínima mudança) */
  setActiveGuestId: (guestId: string | null) => void;

  /** Ações do carrinho (atuam no guest ativo) */
  addItem: (item: CartItemProps) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemObservations: (productId: string, observations: string) => void;
  updateItemStatus: (productId: string, status: CartItemProps['status']) => void;
  updateItemAddons: (productId: string, addons: Addon[]) => void;
  clearCart: () => void;

  /** Metas já existentes */
  setOrderType: (type: 'local' | 'takeaway') => void;
  setObservations: (observations: string) => void;

  /** Utilidades (opcional) */
  getTotal: () => number;
}

/** ===== Storage safe p/ SSR e contenção de tamanho ===== */
const customStorage = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const value = window.localStorage.getItem(name);
      if (!value) return null;
      // (Mantido o padrão de você já ter um “trim” se necessário)
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // noop
    }
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // noop
    }
  },
};

/** ===== Helpers ===== */
function ensureGuestId(current: string | null | undefined): string {
  if (typeof current === 'string' && current) {
    return current;
  }
  const guestId = generateOrGetGuestId();
  return guestId ?? '';
}

function getGuestItems(state: CartStore, guestId: string): CartItemProps[] {
  return state.cartsByGuest[guestId] ?? [];
}

function setGuestItems(
  state: CartStore,
  guestId: string,
  next: CartItemProps[]
): { cartsByGuest: Record<string, CartItemProps[]>; items: CartItemProps[] } {
  return {
    cartsByGuest: { ...state.cartsByGuest, [guestId]: next },
    items: next, // mantém compat: `items` sempre reflete o carrinho do guest ativo
  };
}

/** ===== Store ===== */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Estado “compat”
      items: [],
      tableId: null,
      restaurantId: null,
      unitId: null,
      guestInfo: null,
      orderType: 'local',
      observations: '',

      // Novo estado mínimo
      activeGuestId: null,
      cartsByGuest: {},

      /** Define/atualiza o guest ativo. */
      setActiveGuestId: (guestId) =>
        set((state) => {
          const id = ensureGuestId(guestId);
          const items = getGuestItems(state, id);
          return { ...state, activeGuestId: id, items };
        }),

      clearCart: () =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          return { ...state, ...setGuestItems(state, id, []) };
        }),

      addItem: (item) =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          const current = getGuestItems(state, id);
          const idx = current.findIndex((i) => i._id === item._id);
          const next =
            idx >= 0
              ? current.map((i, j) =>
                  j === idx ? { ...i, quantity: i.quantity + item.quantity } : i
                )
              : [...current, { ...item }];
          return { ...state, ...setGuestItems(state, id, next) };
        }),

      removeItem: (productId) =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          const current = getGuestItems(state, id);
          const next = current.filter((i) => i._id !== productId);
          return { ...state, ...setGuestItems(state, id, next) };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          const current = getGuestItems(state, id);
          const next = current
            .map((i) => (i._id === productId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0);
          return { ...state, ...setGuestItems(state, id, next) };
        }),

      updateItemObservations: (productId, observations) =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          const current = getGuestItems(state, id);
          const next = current.map((i) =>
            i._id === productId ? { ...i, observations } : i
          );
          return { ...state, ...setGuestItems(state, id, next) };
        }),

      updateItemStatus: (productId, status) =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          const current = getGuestItems(state, id);
          const next = current.map((i) =>
            i._id === productId ? { ...i, status } : i
          );
          return { ...state, ...setGuestItems(state, id, next) };
        }),

      updateItemAddons: (productId, addons) =>
        set((state) => {
          const id = ensureGuestId(state.activeGuestId);
          const current = getGuestItems(state, id);
          const next = current.map((i) =>
            i._id === productId ? { ...i, addons: addons ?? [] } : i
          );
          return { ...state, ...setGuestItems(state, id, next) };
        }),

      setOrderType: (type) => set({ orderType: type }),
      setObservations: (observations) => set({ observations }),

      getTotal: () => {
        const items = get().items;
        return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: 'cart-storage', // mantém sua chave atual
      storage: createJSONStorage(() => customStorage as any),
      partialize: (state: CartStore) => ({
        // persistimos o que já existia…
        items: state.items,
        tableId: state.tableId,
        restaurantId: state.restaurantId,
        unitId: state.unitId,
        orderType: state.orderType,
        observations: state.observations,
        guestInfo: state.guestInfo,
        // …e o novo mínimo para isolar por guest
        activeGuestId: state.activeGuestId,
        cartsByGuest: state.cartsByGuest,
      }),
    }
  )
);
