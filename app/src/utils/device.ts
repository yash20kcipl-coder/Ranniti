import { getUniqueId } from "react-native-device-info";
import Storage from "./storage";

export const GetUniqueId = async () => {
  let device_id = "";
  const deviceId = await Storage.get('deviceId');
  
  if (deviceId) { return deviceId; }

  try {
    device_id = await getUniqueId();
    await Storage.save('deviceId', device_id);
  } catch (error) {
    console.error("Failed to retrieve Unique Device ID:", error);
  }
  
  return device_id ? device_id : "";
};
