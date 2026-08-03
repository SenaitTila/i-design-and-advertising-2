import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Future expansion: you can add courseReducer or enrollmentReducer here seamlessly
  },
});