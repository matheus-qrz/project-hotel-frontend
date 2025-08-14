// lib/axios.ts
import axios from 'axios';
import { useRestaurantStore } from '@/stores';

const api = axios.create({
    baseURL: '/'
});

api.interceptors.request.use((config) => {
    const restaurantId = useRestaurantStore.getState().restaurant?._id;
    if (restaurantId) {
        config.headers['X-Restaurant-ID'] = restaurantId;
    }
    return config;
});

export default api;