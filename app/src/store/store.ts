import { thunk } from "redux-thunk";
import authReducer from "./reducers/auth";
import teamReducer from "./reducers/team";
import voterReducer from "./reducers/voters";
import supportReducer from "./reducers/support";
import dashboardReducer from "./reducers/dashboard";
import appVersionReducer from "./reducers/appVersion";
import influencersReducer from "./reducers/influencers";
import contactSyncReducer from "./reducers/contactSync";
import familyMappingReducer from "./reducers/familyMapping";
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore, applyMiddleware, combineReducers } from "redux";

const persistConfig = {
  key: 'root',
  blacklist: [],
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  team: teamReducer,
  voters: voterReducer,
  support: supportReducer,
  dashboard: dashboardReducer,
  appVersion: appVersionReducer,
  influencers: influencersReducer,
  contactSync: contactSyncReducer,
  familyMapping: familyMappingReducer,
});

const persistedReducer = persistReducer(persistConfig as any, rootReducer as any);
const store = createStore(persistedReducer, applyMiddleware(thunk as any));
const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export { store, persistor };