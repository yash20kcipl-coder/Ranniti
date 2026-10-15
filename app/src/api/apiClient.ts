import axios from 'axios';
import Url from '../utils/url';
import toast from '../utils/toast';
import { store } from '../store/store';
import { LOG_OUT } from '../store/reducers/auth';
import { SCREENS } from '../navigation/constants';
import { reset } from '../navigation/navigationUtils';
import Storage, { STORAGE_KEYS } from '../utils/storage';

const BaseUrl = `${Url.BaseUrl}/api/v1`;

const apiClient = axios.create({
    baseURL: BaseUrl,
    headers: { 'Content-Type': 'application/json' },
});

// 🔒 Strategic Lock: Prevents parallel concurrent 401 failures from triggering multiple logouts
let isLoggingOut = false;

/**
 * Highly secure session eviction routine.
 * Runs anytime the server challenges credentials with 401 or profile is not found (404).
 */
const triggerAutoLogout = async (customMessage?: string) => {
    if (isLoggingOut) {
        return console.log("⚠️ Session invalidation intercepted but logout lock is active. Suppressing redundant trigger.");
    }
    isLoggingOut = true;

    try {
        console.warn("🚫 Intercepted invalid/expired session: Wiping authentication context vectors.");

        // 1. Clear local running memory token
        (globalThis as any).token = null;

        // 2. Wipe offline cache to prevent silent restoration attempt
        await Storage.clearAll();

        // 3. Evict user identity vectors from memory
        store.dispatch({ type: LOG_OUT });

        // 4. Perform forced redirect back to system landing gateway
        reset(SCREENS.LOGIN);

        // 5. Report status nicely to user without emojis
        toast.error(customMessage || "Your session has expired. Please log in again.");
    } catch (e) {
        console.error("💥 Auto-logout routine blowing up:", e);
        // Absolute terminal fallback redirect
        reset(SCREENS.LOGIN);
    } finally {
        // Cool-down: Reset lock after 3 seconds once system settles on Login landing scope
        setTimeout(() => {
            isLoggingOut = false;
        }, 3000);
    }
};

apiClient.interceptors.request.use(
    async (config: any) => {
        config.api_call_time = new Date();

        // Dynamically inject active token into all outbound requests securely
        let token = (globalThis as any).token;
        if (!token) {
            token = await Storage.get(STORAGE_KEYS.TOKEN);
            if (token) {
                (globalThis as any).token = token;
            }
        }

        if (token) {
            // Server expects standard standard "Bearer <token>" footprint
            config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        return config;
    },
    (error) => { return Promise.reject(error) }
);

apiClient.interceptors.response.use(
    (response: any) => {
        if (response?.data) {
            if ((!response?.data?.success && response?.data?.hasOwnProperty("success"))) {
                const message = `${response?.config?.url?.replace(BaseUrl, '')} => ${response?.status || response?.data?.status} => ${response?.config?.method} => ${response?.config?.data ? JSON.stringify(response?.config?.data) : ""} => ${response?.data ? JSON.stringify(response?.data) : ""}`;
                console.error(message)
            }
        }

        const timeTaken = response?.config?.api_call_time ? (Number(new Date()) - Number(response?.config?.api_call_time)) / 1000 : 0;
        if (timeTaken > 5) {
            console.warn(`time taken ${response?.config?.url?.replace(BaseUrl, '')}`, timeTaken + " seconds");
        }
        return response;
    },
    async (error) => {
        const message = `${error?.response?.config?.url?.replace(BaseUrl, '')} => ${error?.response?.status || error?.response?.data?.status} => ${error?.response?.config?.method} => ${error?.response?.config?.params ? JSON.stringify(error?.response?.config?.params) : ""} => ${error?.response?.data ? JSON.stringify(error?.response?.data) : ""}`;
        console.error(message);

        const status = error?.response?.status || error?.response?.data?.status;
        const url = String(error?.response?.config?.url || '');
        const responseMsg = String(error?.response?.data?.message || '').toLowerCase();

        // 🛡️ Active Perimeter Defense: Intercept 401 or non-existent profile 404 and evict user immediately
        const isAuth401 = status === 401;
        const isProfileNotFound404 = status === 404 && (
            url.includes('mobile/role-access') ||
            url.includes('mobile/auth') ||
            responseMsg.includes('user profile not found') ||
            responseMsg.includes('volunteer not found')
        );

        if (isAuth401 || isProfileNotFound404) {
            await triggerAutoLogout("Your session has expired. Please log in again.");
        }

        return Promise.reject(error);
    }
);

export default apiClient;
