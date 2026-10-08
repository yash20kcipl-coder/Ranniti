import { Platform } from 'react-native';

const getLocalHost = () => {
  // Machine Wi-Fi IP: 192.168.1.9 | Active Backend Port: 10001
  const LOCAL_IP = '192.168.1.9';
  const PORT = '10001';

  if (Platform.OS === 'android') {
    // Works for both physical Android device over Wi-Fi and Emulator
    return `http://${LOCAL_IP}:${PORT}`;
  }
  return `http://${LOCAL_IP}:${PORT}`;
};

const Url = {
  BaseUrl: getLocalHost(),
};

export default Url;
