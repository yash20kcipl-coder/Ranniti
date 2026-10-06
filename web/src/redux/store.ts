import { Log_Out } from './actions/auth';
import roleReducer from './reducers/role';
import userreducers from './reducers/user';
import voterReducer from './reducers/voter';
import tenantReducer from './reducers/tenant';
import masterreducers from './reducers/master';
import settingsReducer from './reducers/settings';
import volunteerReducer from './reducers/volunteer';
import dashboardreducers from './reducers/dashboard';
import importJobsReducer from './reducers/importJobs';
import familyMappingReducer from './reducers/familyMapping';
import { combineReducers, configureStore, type UnknownAction } from '@reduxjs/toolkit';

const appReducer = combineReducers({
  role: roleReducer,
  user: userreducers,
  auth: userreducers,
  voter: voterReducer,
  tenant: tenantReducer,
  master: masterreducers,
  settings: settingsReducer,
  volunteer: volunteerReducer,
  dashboard: dashboardreducers,
  importJobs: importJobsReducer,
  familyMapping: familyMappingReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) => {
  if (action.type === Log_Out) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;


