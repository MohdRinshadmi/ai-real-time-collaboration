/* eslint-disable no-undef */

// react-native-keychain is a native module; stub it for the JS test runtime.
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
  ACCESSIBLE: {AFTER_FIRST_UNLOCK: 'AfterFirstUnlock'},
}));
