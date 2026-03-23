import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

const ANDROID_KEYBOARD_ACCESSORY_OFFSET = 56;

export function useKeyboardOffset() {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const extraOffset = Platform.OS === 'android' ? ANDROID_KEYBOARD_ACCESSORY_OFFSET : 0;
      setKeyboardOffset(event.endCoordinates.height + extraOffset);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardOffset;
}
