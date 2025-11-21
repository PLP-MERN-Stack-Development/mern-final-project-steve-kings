import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Tier {
    _id: string;
    name: string;
    price: number;
    vote_limit: number;
    description?: string;
}

interface TiersState {
    tiers: Tier[];
    selectedTier: Tier | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: TiersState = {
    tiers: [],
    selectedTier: null,
    isLoading: false,
    error: null,
};

const tiersSlice = createSlice({
    name: 'tiers',
    initialState,
    reducers: {
        setTiers: (state, action: PayloadAction<Tier[]>) => {
            state.tiers = action.payload;
        },
        setSelectedTier: (state, action: PayloadAction<Tier | null>) => {
            state.selectedTier = action.payload;
        },
        addTier: (state, action: PayloadAction<Tier>) => {
            state.tiers.push(action.payload);
        },
        updateTier: (state, action: PayloadAction<Tier>) => {
            const index = state.tiers.findIndex(t => t._id === action.payload._id);
            if (index !== -1) {
                state.tiers[index] = action.payload;
            }
        },
        removeTier: (state, action: PayloadAction<string>) => {
            state.tiers = state.tiers.filter(t => t._id !== action.payload);
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
    setTiers,
    setSelectedTier,
    addTier,
    updateTier,
    removeTier,
    setLoading,
    setError
} = tiersSlice.actions;

export default tiersSlice.reducer;
