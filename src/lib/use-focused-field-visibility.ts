import { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import { useKeyboardOffset } from '@/lib/use-keyboard-offset';

type FieldLayout = {
  y: number;
  height: number;
};

type FocusedFieldVisibilityOptions = {
  bottomInset?: number;
  bottomMargin?: number;
  topMargin?: number;
};

type MeasureInWindowTarget = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

export function useFocusedFieldVisibility({
  bottomInset = 0,
  bottomMargin = 12,
  topMargin = 12,
}: FocusedFieldVisibilityOptions = {}) {
  const keyboardOffset = useKeyboardOffset();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollYRef = useRef(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!focusedField || keyboardOffset <= 0 || viewportHeight <= 0) {
      return;
    }

    const settleId = setTimeout(() => {
      const scrollView = scrollViewRef.current as (ScrollView & MeasureInWindowTarget) | null;
      const focusedInput = TextInput.State.currentlyFocusedInput?.();

      if (
        !scrollView ||
        !focusedInput ||
        typeof focusedInput.measureInWindow !== 'function'
      ) {
        return;
      }

      scrollView.measureInWindow((_scrollX, scrollYWindow, _scrollWidth, scrollHeightWindow) => {
        focusedInput.measureInWindow((_fieldX, fieldYWindow, _fieldWidth, fieldHeightWindow) => {
          const visibleTopWindow = scrollYWindow + topMargin;
          const visibleBottomWindow =
            scrollYWindow + scrollHeightWindow - keyboardOffset - bottomInset - bottomMargin;
          const fieldTopWindow = fieldYWindow;
          const fieldBottomWindow = fieldYWindow + fieldHeightWindow + 16;

          let delta = 0;

          if (fieldBottomWindow > visibleBottomWindow) {
            delta = fieldBottomWindow - visibleBottomWindow;
          } else if (fieldTopWindow < visibleTopWindow) {
            delta = fieldTopWindow - visibleTopWindow;
          }

          if (delta === 0) {
            return;
          }

          scrollView.scrollTo({
            y: Math.max(0, scrollYRef.current + delta),
            animated: true,
          });
        });
      });
    }, 50);

    return () => clearTimeout(settleId);
  }, [bottomInset, bottomMargin, focusedField, keyboardOffset, topMargin, viewportHeight]);

  const registerFieldLayout = useCallback((_fieldName: string, _layout: FieldLayout) => {
    // The helper now measures the focused input in window coordinates, so cached local
    // layout positions are no longer needed. Keep this callback for existing form wiring.
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  const handleFieldFocus = useCallback((fieldName: string) => {
    setFocusedField(fieldName);
  }, []);

  const handleFieldBlur = useCallback((fieldName?: string) => {
    setFocusedField((current) => {
      if (!fieldName || current === fieldName) {
        return null;
      }

      return current;
    });
  }, []);

  return {
    handleFieldBlur,
    handleFieldFocus,
    handleScroll,
    handleViewportLayout,
    keyboardOffset,
    registerFieldLayout,
    scrollViewRef,
  };
}
