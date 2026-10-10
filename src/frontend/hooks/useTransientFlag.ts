import { useEffect, useState } from "react";

/** True for `ms` after `trigger` becomes true; purely presentational. */
export function useTransientFlag(trigger: boolean, ms: number): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!trigger) {
      setOn(false);
      return;
    }
    setOn(true);
    const timer = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(timer);
  }, [trigger, ms]);
  return on;
}
