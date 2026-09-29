import userreducers from './reducers/user';
import voterReducer from './reducers/voter';
import masterreducers from './reducers/master';
import dashboardreducers from './reducers/dashboard';
import importJobsReducer from './reducers/importJobs';

import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    user: userreducers,
    auth: userreducers,
    voter: voterReducer,
    master: masterreducers,
    dashboard: dashboardreducers,
    importJobs: importJobsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

