import { v4 as uuidv4 } from 'uuid';
import { useGuestStore } from '@/stores/auth';

export const initializeGuestSession = () => {
    const { guestInfo, setSessionId } = useGuestStore.getState();

    let existingSessionId = localStorage.getItem('guest_session_id');

    if (!existingSessionId) {
        existingSessionId = uuidv4();
        localStorage.setItem('guest_session_id', existingSessionId);
    }

    setSessionId(existingSessionId);

    console.log('Guest ID:', guestInfo?.id, 'Session ID:', existingSessionId);
};
