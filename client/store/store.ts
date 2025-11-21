// Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import electionsReducer from './slices/electionsSlice';
import tiersReducer from './slices/tiersSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        elections: electionsReducer,
        tiers: tiersReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
