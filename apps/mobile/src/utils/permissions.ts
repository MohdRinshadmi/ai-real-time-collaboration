import {PermissionsAndroid, Platform} from 'react-native';

// Microphone permission for WebRTC voice huddles.
//
// iOS: the prompt is triggered by getUserMedia itself, gated on the
// NSMicrophoneUsageDescription string in Info.plist — nothing to request here.
// Android: RECORD_AUDIO is a runtime ("dangerous") permission, so we must ask
// explicitly before opening the mic.
export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone access',
      message: 'Collab needs your microphone to join voice huddles.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
