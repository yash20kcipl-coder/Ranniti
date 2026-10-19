import authReducer from "./reducers/auth";
import teamReducer from "./reducers/team";
import voterReducer from "./reducers/voters";
import masterReducer from "./reducers/master";
import supportReducer from "./reducers/support";
import { boothsReducer } from "./reducers/booths";
import { thunk, ThunkDispatch } from "redux-thunk";
import dashboardReducer from "./reducers/dashboard";
import appVersionReducer from "./reducers/appVersion";
import influencersReducer from "./reducers/influencers";
import familyMappingReducer from "./reducers/familyMapping";
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import electionReducer, { ElectionState } from "./reducers/election";
import contactSyncReducer, { ContactSyncState } from "./reducers/contactSync";
import { createStore, applyMiddleware, combineReducers, UnknownAction } from "redux";

const persistConfig = {
  key: 'root',
  blacklist: [],
  storage: AsyncStorage,
  whitelist: ['auth', 'contactSync', 'election'],
};

const contactSyncPersistConfig = {
  key: 'contactSync',
  storage: AsyncStorage,
  blacklist: ['loading', 'syncing'],
};

const electionPersistConfig = {
  key: 'election',
  storage: AsyncStorage,
  whitelist: ['offlineQueue'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  team: teamReducer,
  voters: voterReducer,
  booths: boothsReducer,
  master: masterReducer,
  support: supportReducer,
  dashboard: dashboardReducer,
  appVersion: appVersionReducer,
  influencers: influencersReducer,
  familyMapping: familyMappingReducer,
  election: persistReducer<ElectionState>(electionPersistConfig as any, electionReducer as any),
  contactSync: persistReducer<ContactSyncState>(contactSyncPersistConfig as any, contactSyncReducer as any),
});


const persistedReducer = persistReducer(persistConfig as any, rootReducer as any);
const store = createStore(persistedReducer, applyMiddleware(thunk as any));
const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

export { store, persistor };