export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_requested' | 'paid';

export const StatusTexts: Record<OrderStatus, string> = {
    pending: 'Pendente',
    processing: 'Em preparo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    payment_requested: 'Pagamento solicitado',
    paid: 'Pago'
};

export const StatusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-200 text-yellow-800',
    processing: 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
    cancelled: 'bg-red-200 text-red-800',
    payment_requested: 'bg-purple-200 text-purple-800',
    paid: 'bg-gray-200 text-gray-800'
};