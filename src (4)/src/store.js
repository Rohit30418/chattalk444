import { configureStore } from '@reduxjs/toolkit';
import { Reducer } from './redux/Reducer';

export const store = configureStore({
  reducer: Reducer,
  devTools: import.meta.env.DEV,
});
