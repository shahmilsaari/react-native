import { create } from 'zustand';

export type Event = {
    id: string;
    name: string;
    eventDate: string; // ISO
    location?: string;
    isActive: boolean;
};

type EventState = {
    selectedEvent: Event | null;
    setSelectedEvent: (event: Event | null) => void;
};

export const useEventStore = create<EventState>((set) => ({
    selectedEvent: null,
    setSelectedEvent: (event) => set({ selectedEvent: event }),
}));
