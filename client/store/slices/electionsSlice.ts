import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Candidate {
    _id: string;
    name: string;
    position: string;
    photoUrl?: string;
    manifesto?: string;
    voteCount: number;
}

interface Election {
    _id: string;
    title: string;
    description: string;
    clubName: string;
    startDate: string;
    endDate: string;
    candidates: Candidate[];
    manager_id?: string;
    thumbnail_url?: string;
    isActive: boolean;
}

interface ElectionsState {
    elections: Election[];
    currentElection: Election | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ElectionsState = {
    elections: [],
    currentElection: null,
    isLoading: false,
    error: null,
};

const electionsSlice = createSlice({
    name: 'elections',
    initialState,
    reducers: {
        setElections: (state, action: PayloadAction<Election[]>) => {
            state.elections = action.payload;
        },
        setCurrentElection: (state, action: PayloadAction<Election | null>) => {
            state.currentElection = action.payload;
        },
        addElection: (state, action: PayloadAction<Election>) => {
            state.elections.push(action.payload);
        },
        updateElection: (state, action: PayloadAction<Election>) => {
            const index = state.elections.findIndex(e => e._id === action.payload._id);
            if (index !== -1) {
                state.elections[index] = action.payload;
            }
        },
        removeElection: (state, action: PayloadAction<string>) => {
            state.elections = state.elections.filter(e => e._id !== action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const {
    setElections,
    setCurrentElection,
    addElection,
    updateElection,
    removeElection,
    setLoading,
    setError
} = electionsSlice.actions;

export default electionsSlice.reducer;
