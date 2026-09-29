import { LOG_IN, LOG_OUT, SET_USER_PROFILE, SET_ACADEMIC_YEAR, SET_AUTH_LOADING, SET_SELECTED_STUDENT_ID, SET_PARENT_PROFILE } from "../reducers/auth";
import Storage, { STORAGE_KEYS } from "../../utils/storage";
import toast from "../../utils/toast";
import { navigateToDashboard, reset } from "../../navigation/navigationUtils";
import { SCREENS } from "../../navigation/constants";
import { Dispatch } from "redux";
import { Platform } from "react-native";
import apiClient from "../../api/apiClient";
import { GetUniqueId } from "../../utils/device";
import { createFcmToken, removeFcmToken } from "../../utils/notification";
import { ThunkDispatch } from "redux-thunk";

const saveLogin = async (token: string, role: string, message: string, dispatch: ThunkDispatch<any, any, any>, onSuccess?: (token: string) => Promise<void>) => {
  (globalThis as any).token = token;
  const multiPayload: Array<[string, any]> = [[STORAGE_KEYS.TOKEN, token], [STORAGE_KEYS.ROLE, role]];
  dispatch({ type: LOG_IN, payload: { token, role } });
  await Storage.multiSave(multiPayload);
  if (onSuccess) { await onSuccess(token) }

  await dispatch(hydrateExistingSessionAction(
    token, role, (childCount) => {
      navigateToDashboard(role, childCount);
      toast.success(message);
    }, () => {
      toast.error(message);
      dispatch(logoutAction());
    }));
};

export const staffLoginAction = (data: any, setLoading: (loading: boolean) => void, onSuccess?: (token: string) => Promise<void>) => {
  return async (dispatch: Dispatch) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/staff/login', data);
      const { data: { token, user }, message } = response.data;
      await saveLogin(token, 'teacher', message || "Logged in as Staff", dispatch, onSuccess);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Staff login failed.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
};

export const parentLoginAction = (data: any, setLoading: (loading: boolean) => void, onSuccess?: (token: string) => Promise<void>) => {
  return async (dispatch: Dispatch) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/parent/login', data);
      const { data: { token, user }, message } = response.data;
      await saveLogin(token, 'parent', message || "Logged in as Parent", dispatch, onSuccess);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Parent login failed.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
};

export const studentLoginAction = (data: any, setLoading: (loading: boolean) => void, onSuccess?: (token: string) => Promise<void>) => {
  return async (dispatch: Dispatch) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/student/login', data);
      const { data: { token, user }, message } = response.data;
      await saveLogin(token, 'student', message || "Logged in as Student", dispatch, onSuccess);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Student login failed.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
};

const getProfileHeaders = async () => {
  try {
    const deviceId = await GetUniqueId();
    const fcmResponse = await createFcmToken();
    return {
      'device-id': deviceId || '',
      'fcm-token': fcmResponse?.token || '',
      'platform': Platform.OS === 'ios' ? 'ios' : 'android',
    };
  } catch (e) {
    return {};
  }
};

export const fetchStudentProfileAction = (callback?: (studentData: any) => void) => {
  return async (dispatch: Dispatch) => {
    try {
      const studentId = await Storage.get(STORAGE_KEYS.USER_ID);
      if (!studentId) return;
      const headers = await getProfileHeaders();
      const response = await apiClient.get(`/auth/student/profile/${studentId}`, { headers });
      const userData = response.data.data;
      dispatch({ type: SET_USER_PROFILE, payload: userData });
      await Storage.save(STORAGE_KEYS.USER_DATA, userData);
      if (callback) { callback(userData); }
    } catch (error: any) {
      console.error('Student profile fetch failed:', error?.message);
    }
  };
};

export const fetchStaffProfileAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const headers = await getProfileHeaders();
      const response = await apiClient.get('/auth/staff/profile', { headers });
      const userData = response.data.data;
      dispatch({ type: SET_USER_PROFILE, payload: userData });
      await Storage.save(STORAGE_KEYS.USER_DATA, userData);
    } catch (error: any) {
      console.error('Staff profile fetch failed:', error?.message);
    }
  };
};

export const fetchParentProfileAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_AUTH_LOADING, payload: true });
    try {
      const headers = await getProfileHeaders();
      const response = await apiClient.get('/auth/parent/profile', { headers });

      const userData = response.data.data;
      dispatch({ type: SET_PARENT_PROFILE, payload: userData });
      await Storage.save(STORAGE_KEYS.PARENT_DATA, userData);

    } catch (error: any) {
      console.error("❌ Parent profile pull aborted:", error?.message);
    } finally {
      dispatch({ type: SET_AUTH_LOADING, payload: false });
    }
  };
};

/**
 * Re-Synchronizes the active hardware footprint with the live server environment.
 * Triggers anytime Firebase yields a refreshed container hash.
 */
export const syncDeviceTokenAction = () => {
  return async () => {
    try {
      console.log("🔄 Auditing active hardware footprint for cloud delivery...");
      const deviceId = await GetUniqueId();
      const fcmResponse = await createFcmToken();

      if (!deviceId || !fcmResponse?.token) {
        return console.log("⚠️ Hardware fingerprint delayed. Registration bypassed.");
      }

      await apiClient.post('/auth/register-device', {
        deviceId,
        fcmToken: fcmResponse.token
      });
      console.log("✅ Active device synchronized securely.");
    } catch (e: any) {
      console.warn("⚠️ Transient sync bypassed:", e.message);
    }
  };
};

export const logoutAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      const deviceId = await GetUniqueId();

      // Explicitly hit logout cleanup endpoint on the backend, providing DeviceID
      try {
        await apiClient.post('/auth/logout', { deviceId });
      } catch (e) {
        console.warn("Backend logout endpoint reported discrepancy:", e);
      }

      // Purge local memory context
      (globalThis as any).token = null;

      // Scrub persistent store
      await Storage.clearAll();

      // Nuke local firebase token storage and remote mapping
      await removeFcmToken();

      // Eagerly generate a completely fresh FCM footprint for the next upcoming session
      await createFcmToken();

      // Update redundant Redux state
      dispatch({ type: LOG_OUT });

      // Propagate forced visual redirect back to initial landing scope
      reset(SCREENS.PROFILE_OPTION);

      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Comprehensive Logout Panic:", error);
      toast.error("Trouble clearing profile. Forced fallback initiated.");
      // Final fallback safeguard
      reset(SCREENS.PROFILE_OPTION);
    }
  };
};

/**
 * Hot-Reload Routine for existing persistent sessions on App startup.
 * Retrieves latest Profile + Active Calendar before allowing Dashboard reveal.
 */
export const hydrateExistingSessionAction = (token: string, role: string, onComplete: (childCount: number) => void, onFailure: () => void) => {
  return async (dispatch: ThunkDispatch<any, any, any>) => {
    try {
      (globalThis as any).token = token;
      let finalUser: any = null;
      let finalYear: any = null;

      const profileKey = role === 'parent' ? STORAGE_KEYS.PARENT_DATA : STORAGE_KEYS.USER_DATA;
      const profileUrl = role === 'parent' ? '/auth/parent/profile' : role === 'teacher' ? '/auth/staff/profile' : '/auth/student/profile';
      const headers = await getProfileHeaders();
      const [profileRes, yearRes] = await Promise.allSettled([apiClient.get(profileUrl, { headers }), apiClient.get('/academic-years')]);
      dispatch({ type: LOG_IN, payload: { token, role } });

      finalUser = profileRes?.status === 'fulfilled' ? profileRes.value?.data?.data : await Storage.get(profileKey);
      const childCount = role === 'parent' ? (finalUser?.children?.length || 0) : 0;

      if (yearRes.status === 'fulfilled') {
        const rawList = yearRes.value.data?.data;
        finalYear = rawList.find((y: any) => y.status === 'Active') || rawList?.[0];
        if (finalYear) { await dispatch(switchAcademicYearAction(finalYear)) }
      }

      if (role === 'parent') { dispatch({ type: SET_PARENT_PROFILE, payload: finalUser }); }
      else { dispatch({ type: SET_USER_PROFILE, payload: finalUser }); }

      if (role === 'parent') {
        await Storage.save(STORAGE_KEYS.PARENT_ID, finalUser.id);
        if (finalUser.children && finalUser.children.length > 0) {
          await dispatch(setSelectedStudentAction(finalUser.children[0].id))
          if (finalUser.children?.length == 1) {
            const StudentProfileResponse = await apiClient.get(`/auth/student/profile/${finalUser.children[0].id}`, { headers });
            if (StudentProfileResponse?.data?.data) {
              await Storage.save(STORAGE_KEYS.USER_DATA, StudentProfileResponse.data.data);
              dispatch({ type: SET_USER_PROFILE, payload: StudentProfileResponse.data.data });
            }
          }
        }
      } else {
        await Storage.save(STORAGE_KEYS.USER_ID, finalUser.id);
      }

      onComplete(childCount);
    } catch (e) {
      console.error("💥 Catastrophic session restoration blowout:", e);
      onFailure();
    }
  };
};

/**
 * Unified Action to retrieve the canonical list of available academic years
 */
export const fetchAcademicYearsAction = async () => {
  try {
    const res = await apiClient.get('/academic-years');
    const list = res?.data?.data || res?.data || [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("⚠️ Failed to query academic cycle timeline:", e);
    return [];
  }
};

/**
 * Persists the selected active academic year across context vectors.
 */
export const switchAcademicYearAction = (year: any, toastMessage = false) => {
  return async (dispatch: Dispatch) => {
    try {
      dispatch({ type: SET_ACADEMIC_YEAR, payload: year });
      await Storage.save("ACADEMIC_YEAR", year);
      if (toastMessage) { toast.success(`Active academic cycle updated to ${year?.name}`); }
    } catch (e) {
      console.error("⚠️ Cycle handoff aborted:", e);
      toast.error("Failed to switch active cycle.");
    }
  };
};

/**
 * Updates the active selected student context in Redux and storage
 */
export const setSelectedStudentAction = (studentId: string, getData: boolean = false) => {
  return async (dispatch: any) => {
    dispatch({ type: SET_SELECTED_STUDENT_ID, payload: studentId });
    await Storage.save(STORAGE_KEYS.USER_ID, studentId);
    if (getData) { await dispatch(fetchStudentProfileAction(() => { navigateToDashboard('parent', 1) })) }
  };
};

export const forgotPasswordAction = (identifier: string, setLoading: (loading: boolean) => void, onSuccess: () => void) => {
  return async (dispatch: any) => {
    setLoading(true);
    dispatch({ type: SET_AUTH_LOADING, payload: true });
    try {
      await apiClient.post('/auth/forgot-password', { identifier });
      toast.success("Verification code sent to your email!");
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to send reset link.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      dispatch({ type: SET_AUTH_LOADING, payload: false });
    }
  };
};

export const resetPasswordAction = (data: any, setLoading: (loading: boolean) => void, onSuccess: () => void) => {
  return async (dispatch: any) => {
    setLoading(true);
    dispatch({ type: SET_AUTH_LOADING, payload: true });
    try {
      await apiClient.post('/auth/reset-password', data);
      toast.success("Password Updated. You can now login.");
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to reset password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      dispatch({ type: SET_AUTH_LOADING, payload: false });
    }
  };
};
