import AsyncStorage, { createAsyncStorage } from "@react-native-async-storage/async-storage";

const storage = createAsyncStorage("appDB");

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_DATA: 'user_data',
  ROLE: 'role',
  USER_ID: 'user_id',
  PARENT_ID: 'parent_id',
  PARENT_DATA: 'parent_data',
  APP_VERSION: 'app_version',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  USER_MPIN: 'user_mpin',
  IS_MPIN_SET: 'is_mpin_set',
} as const;

export const saveString = async (key: string, value: string) => {
  try {
    await storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const save = async (key: string, value: any) => {
  const _value = typeof value === "string" ? value : JSON.stringify(value);
  return await saveString(key, _value);
};

export const get = async (key: string) => {
  try {
    const itemString = await storage.getItem(key);
    if (itemString) {
      try {
        let _value = JSON.parse(itemString);
        // Parity with legacy Storage.js number-to-string handling
        _value = typeof _value === "number" ? String(_value) : _value;
        return _value;
      } catch {
        return itemString;
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const remove = async (key: string) => {
  try {
    await storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const multiSave = async (data: [string, any][]) => {
  try {
    await Promise.all(data.map(async ([key, value]) => {
      await save(key, value);
    }));
    return true;
  } catch {
    return false;
  }
};

export const clearAll = async () => {
  try {
    const keys = await storage.getAllKeys();
    await Promise.all(keys.map(key => storage.removeItem(key)));
    return true;
  } catch {
    return false;
  }
};

/**
 * Migrates data from default AsyncStorage to the namespaced 'appDB' storage.
 * Matches migrateLegacyData from legacy Storage.js
 */
export const migrateLegacyData = async () => {
  try {
    const isMigrated = await storage.getItem('MIGRATION_COMPLETED');
    if (isMigrated) return;

    const keys = await AsyncStorage.getAllKeys();
    if (keys && keys.length > 0) {
      for (const key of keys) {
        if (key === 'MIGRATION_COMPLETED') continue;
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          await storage.setItem(key, value);
          await AsyncStorage.removeItem(key);
        }
      }
    }

    await storage.setItem('MIGRATION_COMPLETED', 'true');
  } catch (error) {
    console.error("Storage Migration Error:", error);
  }
};

export default {
  saveString,
  save,
  get,
  remove,
  multiSave,
  clearAll,
  migrateLegacyData,
  STORAGE_KEYS,
  storage,
};
