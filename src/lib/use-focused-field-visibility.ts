import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [fieldLayouts, setFieldLayouts] = useState<Record<string, FieldLayout>>({});

  useEffect(() => {
    if (!focusedField || keyboardOffset <= 0 || viewportHeight <= 0) {
      return;
    }

    const layout = fieldLayouts[focusedField];
    if (!layout) {
      return;
    }

    const visibleTop = scrollYRef.current + topMargin;
    const visibleBottom =
      scrollYRef.current + viewportHeight - keyboardOffset - bottomInset - bottomMargin;
    const fieldTop = layout.y;
    const fieldBottom = layout.y + layout.height + 16;

    let targetOffset: number | null = null;

    if (fieldBottom > visibleBottom) {
      targetOffset = scrollYRef.current + (fieldBottom - visibleBottom);
    } else if (fieldTop < visibleTop) {
      targetOffset = Math.max(0, scrollYRef.current - (visibleTop - fieldTop));
    }

    if (targetOffset !== null) {
      scrollViewRef.current?.scrollTo({
        y: targetOffset,
        animated: true,
      });
    }
  }, [bottomInset, bottomMargin, fieldLayouts, focusedField, keyboardOffset, topMargin, viewportHeight]);

  const registerFieldLayout = useCallback((fieldName: string, layout: FieldLayout) => {
    setFieldLayouts((current) => {
      const previous = current[fieldName];
      if (previous && previous.y === layout.y && previous.height === layout.height) {
        return current;
      }

      return {
        ...current,
        [fieldName]: layout,
      };
    });
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
