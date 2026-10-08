import { SCREENS } from "./constants";
import { store } from "../store/store";
import { fetchVotersAction, setVoterFiltersAction } from "../store/actions/voters";
import { CommonActions, createNavigationContainerRef, StackActions } from "@react-navigation/native";

const st = store as any

export const navigationRef = createNavigationContainerRef<any>();

const lowerCaseName = (name: any) => (typeof name === "string" ? name.toLowerCase() : name);

const formatParams = (params: any): any => {
  if (!params || typeof params !== 'object') return params;
  const newParams = { ...params };
  if (newParams.screen) {
    newParams.screen = lowerCaseName(newParams.screen);
  }
  if (newParams.params) {
    newParams.params = formatParams(newParams.params);
  }
  return newParams;
};

const formatRoute = (route: any) => {
  if (!route) return route;
  if (typeof route === 'string') return { name: lowerCaseName(route) };
  return {
    ...route,
    name: lowerCaseName(route.name),
    params: formatParams(route.params),
  };
};

let isNavigationReady = false;
let navigationQueue: Array<{ name: string; params?: any }> = [];

export function onNavigationReady() {
  isNavigationReady = true;
  while (navigationQueue.length > 0) {
    const next = navigationQueue.shift();
    if (next) {
      try {
        navigationRef.navigate(lowerCaseName(next.name), formatParams(next.params));
      } catch (err) {
        console.error('Failed to execute queued navigation:', err);
      }
    }
  }
}

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(lowerCaseName(name), formatParams(params));
  } else {
    navigationQueue.push({ name, params });
  }
}

export function replace(name: string, param?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(lowerCaseName(name), formatParams(param)));
  }
}

export function reset(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [formatRoute({ name, params })],
      })
    );
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetArray(routes: any[]) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset({ index: routes?.length - 1, routes: routes?.map(formatRoute) }));
  }
}

export function navigateToDashboard(role?: string) {
  resetArray([SCREENS.MAIN]);
}


export function navigatToVoters(paramsOrRole?: any) {
  if (paramsOrRole && typeof paramsOrRole === 'object' && paramsOrRole.boothId) {
    st.dispatch(setVoterFiltersAction({ boothNo: paramsOrRole.boothId }));
  } else {
    const currentBooth = st.getState?.()?.voters?.filters?.boothNo;
    if (currentBooth && currentBooth !== 'All') {
      st.dispatch(setVoterFiltersAction({ boothNo: 'All' }));
    } else {
      st.dispatch(fetchVotersAction(1, false));
    }
  }
  navigate(SCREENS.VOTER_LIST, typeof paramsOrRole === 'object' ? paramsOrRole : undefined);
}

export const navigateToVoters = navigatToVoters;

