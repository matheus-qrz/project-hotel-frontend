// src/utils/orderSession.ts
export const ORDER_SESSION_KEY = 'orderSessionId';

function genId() {
  try {
    // moderno e único:
    return crypto.randomUUID();
  } catch {
    // fallback
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getOrCreateOrderSessionId(): string {
  if (typeof window === 'undefined') {
    // em SSR não crie nada; deixe para o cliente
    return '';
  }
  let id = localStorage.getItem(ORDER_SESSION_KEY);
  if (!id) {
    id = genId();
    try { localStorage.setItem(ORDER_SESSION_KEY, id); } catch {}
  }
  return id;
}

// use só quando quiser *invalidar* a sessão do pedido (ex.: ao fechar a conta/mesa)
export function clearOrderSessionId() {
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(ORDER_SESSION_KEY); } catch {}
  }
}
