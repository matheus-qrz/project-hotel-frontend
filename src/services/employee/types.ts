// src/types/employee.ts
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

export interface ICreateEmployeeData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    role: Role;
    unitId: string;
}
