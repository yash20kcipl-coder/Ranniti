import {
  SET_TENANTS_DATA,
  SET_TENANTS_LOADING,
  ADD_TENANT_USER,
  UPDATE_TENANT_USER,
  UPDATE_TENANT_STATUS,
  DELETE_TENANT_USER,
} from '../actions/tenant';

export interface TenantState {
  tenants: any[];
  loading: boolean;
}

const initialState: TenantState = {
  tenants: [],
  loading: false,
};

export default function tenantReducer(state = initialState, action: any): TenantState {
  switch (action.type) {
    case SET_TENANTS_DATA:
      return {
        ...state,
        tenants: action.payload,
      };

    case SET_TENANTS_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ADD_TENANT_USER:
      return {
        ...state,
        tenants: [action.payload, ...state.tenants],
      };

    case UPDATE_TENANT_USER:
      return {
        ...state,
        tenants: state.tenants.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };

    case UPDATE_TENANT_STATUS:
      return {
        ...state,
        tenants: state.tenants.map((t) =>
          t.id === action.payload.id
            ? { ...t, accountStatus: action.payload.status, provisioningStatus: action.payload.status }
            : t
        ),
      };

    case DELETE_TENANT_USER:
      return {
        ...state,
        tenants: state.tenants.filter((t) => t.id !== action.payload),
      };

    default:
      return state;
  }
}

