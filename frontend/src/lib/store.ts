import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    createdAt?: string;
    updatedAt?: string;
};

type Store = {
    messages: Message[];
    setMessages: (updater: (prev: Message[]) => Message[]) => void;
};

const useAuthStore = create((set) => ({
    token: null,
    userId: null,

    async initSession() {
        let storedUserId = localStorage.getItem('anon_user_id');
        if (!storedUserId) {
            storedUserId = crypto.randomUUID();
            localStorage.setItem('anon_user_id', storedUserId);
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/anon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: storedUserId }),
        });

        const data = await res.json();
        console.log(data)
        localStorage.setItem('session_token', data.token);

        set({ token: data.token, userId: data.userId });
        return data.token;
    },
}));




const useStore = create<Store>()(
    persist(
        (set) => ({
            messages: [],
            setMessages: (updater) =>
                set((state) => ({
                    messages: updater(state.messages),
                })),
        }),
        { name: 'chat-storage' }
    )
);


export { useAuthStore, useStore };
export type { Message };
