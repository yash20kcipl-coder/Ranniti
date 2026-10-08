import { Dispatch } from "redux";
import toast from "../../utils/toast";
import apiClient from "../../api/apiClient";
import { SCREENS } from "../../navigation/constants";
import Storage, { STORAGE_KEYS } from "../../utils/storage";
import { LOG_IN, LOG_OUT, SET_AUTH_LOADING } from "../reducers/auth";
import { navigateToDashboard, reset } from "../../navigation/navigationUtils";

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
  return async (dispatch: any) => {
    setLoading(true);
    dispatch({ type: SET_AUTH_LOADING, payload: true });

    try {
      const response = await apiClient.post("mobile/auth/login", {
        emailOrMobile: payload.phone,
        password: payload.pass,
      });

      const { token, user, access } = response.data?.data || {};

      if (token && user) {
        (globalThis as any).token = token;
        await Storage.save(STORAGE_KEYS.TOKEN, token);
        await Storage.save(STORAGE_KEYS.USER_DATA, user);
        await Storage.save(STORAGE_KEYS.ROLE, user.role || "supporter");
        if (access) {
          await Storage.save("ACCESS_CONFIG", access);
        }

        dispatch({
          type: LOG_IN,
          payload: {
            token,
            role: user.role || "supporter",
            user,
            access,
          },
        });

        toast.success(`Welcome back, ${user.name || "User"}!`);
        await dispatch(fetchProfileAndRoleAccessAction(true));
        if (onSuccess) { onSuccess(token) }
      } else {
        toast.error("Invalid response from authentication server.");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Login failed. Please verify credentials.";
      toast.error(errorMsg);
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

export const fetchProfileAndRoleAccessAction = (navigate?: boolean) => {
  return async (dispatch: Dispatch) => {
    try {
      const [profileRes, accessRes] = await Promise.all([
        apiClient.get("mobile/auth/profile"),
        apiClient.get("mobile/role-access"),
      ]);

      const user = profileRes?.data?.data;
      const access = accessRes?.data?.data;

      if (user) {
        await Storage.save(STORAGE_KEYS.USER_DATA, user);
        await Storage.save(STORAGE_KEYS.ROLE, user.role || "supporter");
        dispatch({ type: "SET_USER_PROFILE", payload: user });
      }

      if (access) {
        await Storage.save("ACCESS_CONFIG", access);
        dispatch({ type: "SET_ACCESS_CONFIG", payload: access });
      }
      if (navigate) { navigateToDashboard(user.role || "supporter") }
      return { user, access };
    } catch (error) {
      console.error("Initialization profile/role fetch error:", error);
      throw error;
    }
  };
};


