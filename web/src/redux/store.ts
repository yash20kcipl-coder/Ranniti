import roleReducer from './reducers/role';
import userreducers from './reducers/user';
import voterReducer from './reducers/voter';
import tenantReducer from './reducers/tenant';
import masterreducers from './reducers/master';
import settingsReducer from './reducers/settings';
import dashboardreducers from './reducers/dashboard';
import importJobsReducer from './reducers/importJobs';
import familyMappingReducer from './reducers/familyMapping';

import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    role: roleReducer,
    user: userreducers,
    auth: userreducers,
    voter: voterReducer,
    tenant: tenantReducer,
    master: masterreducers,
    settings: settingsReducer,
    dashboard: dashboardreducers,
    importJobs: importJobsReducer,
    familyMapping: familyMappingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

