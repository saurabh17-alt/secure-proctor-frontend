/**
 * Violation Manager Hook
 *
 * Handles:
 * - Cooling period management (1 minute after violation)
 * - Image capture when violations occur
 * - Violation logging with timestamps
 * - Alert message display
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface ViolationAlert {
  id: string;
  type: "no_face" | "multiple_faces" | "object_detected" | "looking_away";
  message: string;
  timestamp: number;
  image?: string; // Base64 image
}

export interface CoolingPeriodStatus {
  active: boolean;
  remainingSeconds: number;
  startTime: number | null;
}

const COOLING_PERIOD_DURATION = 60; // 1 minute in seconds

export function useViolationManager() {
  const [alerts, setAlerts] = useState<ViolationAlert[]>([]);
  const [coolingPeriod, setCoolingPeriod] = useState<CoolingPeriodStatus>({
    active: false,
    remainingSeconds: 0,
    startTime: null,
  });

  const coolingTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Start cooling period
  const startCoolingPeriod = useCallback(() => {
    // Clear any existing timers
    if (coolingTimerRef.current) {
      clearTimeout(coolingTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    const startTime = Date.now();

    setCoolingPeriod({
      active: true,
      remainingSeconds: COOLING_PERIOD_DURATION,
      startTime,
    });

    // Countdown timer (update every second)
    countdownTimerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, COOLING_PERIOD_DURATION - elapsed);

      setCoolingPeriod((prev) => ({
        ...prev,
        remainingSeconds: remaining,
      }));

      if (remaining === 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }, 1000);

    // End cooling period after duration
    coolingTimerRef.current = window.setTimeout(() => {
      setCoolingPeriod({
        active: false,
        remainingSeconds: 0,
        startTime: null,
      });
      console.log("✅ Cooling period ended - resuming face detection");
    }, COOLING_PERIOD_DURATION * 1000);

    console.log(
      `⏱️ Cooling period started - ${COOLING_PERIOD_DURATION} seconds`,
    );
  }, []);

  // Add violation alert with image
  const addViolation = useCallback(
    (type: ViolationAlert["type"], message: string, capturedImage?: string) => {
      const alert: ViolationAlert = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        image: capturedImage,
      };

      setAlerts((prev) => [...prev, alert]);

      // Start cooling period
      startCoolingPeriod();

      console.log(`🚨 Violation logged: ${type} - ${message}`);

      return alert;
    },
    [startCoolingPeriod],
  );

  // Clear specific alert
  const clearAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get latest alert of specific type
  const getLatestAlert = useCallback(
    (type: ViolationAlert["type"]) => {
      return alerts
        .filter((alert) => alert.type === type)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
    },
    [alerts],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (coolingTimerRef.current) {
        clearTimeout(coolingTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  return {
    alerts,
    coolingPeriod,
    addViolation,
    clearAlert,
    clearAllAlerts,
    getLatestAlert,
    isInCoolingPeriod: coolingPeriod.active,
  };
}
