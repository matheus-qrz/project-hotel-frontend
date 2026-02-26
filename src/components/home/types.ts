export type RoomStatus = "pending" | "in-progress" | "idle" | "alert";
export type OrderStatus = "pending" | "in-progress" | "done" | "cancelled";
export type ServiceType = "restaurant" | "bar" | "laundry" | "spa";

export interface RoomActivity {
  number: string;
  status: RoomStatus;
  services: ServiceType[];
}

export interface ServiceBreakdown {
  type: ServiceType;
  emoji: string;
  label: string;
  count: number;
  revenue: number;
  color: string;
}

export interface RecentOrder {
  room: string;
  description: string;
  service: ServiceType;
  serviceLabel: string;
  serviceEmoji: string;
  amount: number;
  status: OrderStatus;
  timeAgo: string;
}

export interface MonthRevenue {
  month: string;
  value: number;
}