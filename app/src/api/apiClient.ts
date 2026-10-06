import axios from 'axios';
import Url from '../utils/url';
import toast from '../utils/toast';
import { store } from '../store/store';
import Storage from '../utils/storage';
import { LOG_OUT } from '../store/reducers/auth';
import { SCREENS } from '../navigation/constants';
import { reset } from '../navigation/navigationUtils';

const BaseUrl = `${Url.BaseUrl}/api/v1`;

const apiClient = axios.create({
    baseURL: BaseUrl,
    headers: { 'Content-Type': 'application/json' },
});

// 🔒 Strategic Lock: Prevents parallel concurrent 401 failures from triggering multiple logouts
let isLoggingOut = false;

/**
 * Highly secure session eviction routine.
 * Runs anytime the server challenges the credentials with a 401.
 */
const triggerAutoLogout = async () => {
    if (isLoggingOut) {
        return console.log("⚠️ 401 Intercepted but logout lock is active. Suppressing redundant trigger.");
    }
    isLoggingOut = true;

    try {
        console.warn("🚫 Intercepted 401: Wiping compromised authentication context vectors.");

        // 1. Clear local running memory token
        (globalThis as any).token = null;

        // 2. Wipe offline cache to prevent silent restoration attempt
        await Storage.clearAll();

        // 3. Evict user identity vectors from memory
        store.dispatch({ type: LOG_OUT });

        // 4. Perform forced redirect back to system landing gateway
        reset(SCREENS.LOGIN);

        // 5. Report status nicely to user without emojis
        toast.error("Your session has expired. Please log in again.");
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
        const token = (globalThis as any).token;
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

        // 🛡️ Active Perimeter Defense: Intercept 401 and evict user immediately
        if (error?.response?.status === 401) {
            await triggerAutoLogout();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
