import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseLongPressOptions {
  delay?: number;
  onLongPress?: (e: React.MouseEvent | React.TouchEvent) => void;
  onShortPress?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function useLongPress({
  delay = 500,
  onLongPress,
  onShortPress,
}: UseLongPressOptions) {
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startEventRef = useRef<React.MouseEvent | React.TouchEvent | null>(null);

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsLongPress(false);
    startEventRef.current = e;
    
    timerRef.current = setTimeout(() => {
      setIsLongPress(true);
      onLongPress?.(e);
    }, delay);
  }, [delay, onLongPress]);

  const end = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (!isLongPress && startEventRef.current) {
      onShortPress?.(e);
    }
    
    startEventRef.current = null;
  }, [isLongPress, onShortPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startEventRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: end,
    },
    isLongPress,
  };
}
