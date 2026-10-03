import { Dispatch } from "redux";
import toast from "../../utils/toast";
import { SCREENS } from "../../navigation/constants";
import { navigateToDashboard, reset } from "../../navigation/navigationUtils";
import Storage, { STORAGE_KEYS } from "../../utils/storage";
import { LOG_IN, LOG_OUT, SET_AUTH_LOADING, DEMO_USERS } from "../reducers/auth";

export const loginAction = (
  payload: {
    phone: string,
    pass: string,
    fcmToken: string,
    deviceId: string,
  },
  setLoading: (loading: boolean) => void,
  onSuccess?: (token?: string) => void
) => {
  return async (dispatch: Dispatch) => {
    setLoading(true);
    dispatch({ type: SET_AUTH_LOADING, payload: true });

    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));

      const demoUser = DEMO_USERS.pc_leader;
      const token = 'demo-jwt-token-';

      await Storage.save(STORAGE_KEYS.TOKEN, token);
      await Storage.save(STORAGE_KEYS.USER_DATA, demoUser);
      await Storage.save(STORAGE_KEYS.ROLE, DEMO_USERS.role);

      navigateToDashboard()
      dispatch({ type: LOG_IN, payload: { token, role: DEMO_USERS.role, user: demoUser, } });
      toast.success(`Logged in as ${demoUser.roleName}`);
      if (onSuccess) { onSuccess(token) }
      setLoading(false);
    } catch (error: any) {
      toast.error('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
      dispatch({ type: SET_AUTH_LOADING, payload: false });
    }
  };
};

export const logoutAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      await Storage.clearAll();
      dispatch({ type: LOG_OUT });
      reset(SCREENS.LOGIN);
      toast.success("Logged out successfully.");
    } catch (error) {
      reset(SCREENS.LOGIN);
    }
  };
};

export const forgotPasswordAction = (mobile: string, setLoading?: (l: boolean) => void, onSuccess?: () => void) => {
  return async () => {
    if (setLoading) setLoading(true);
    toast.success("Password reset link sent to your registered mobile.");
    if (setLoading) setLoading(false);
    if (onSuccess) onSuccess();
  };
};

export const resetPasswordAction = (data: any, setLoading?: (l: boolean) => void, onSuccess?: () => void) => {
  return async () => {
    if (setLoading) setLoading(true);
    toast.success("Password updated successfully.");
    if (setLoading) setLoading(false);
    if (onSuccess) onSuccess();
  };
};


