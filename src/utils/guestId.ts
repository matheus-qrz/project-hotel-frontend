// utils/guest.ts
import { v4 as uuidv4 } from 'uuid';

export const generateOrGetGuestId = () => {
    if (typeof window === "undefined") return null;
    const existingId = localStorage.getItem("guestId");
    if (existingId) return existingId;

    const newId = uuidv4();
    localStorage.setItem("guestId", newId);
    return newId;
};
