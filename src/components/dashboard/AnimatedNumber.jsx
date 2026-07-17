"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export default function AnimatedNumber({
  value,
  id,
  className = "",
  style = {},
}) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = currentRef.current;
    const target = value;
    const duration = 800;
    const startTime = performance.now();

    const update = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const v = start + (target - start) * eased;
      setDisplay(v);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(update);
      } else {
        currentRef.current = target;
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span id={id} className={`tabular ${className}`} style={style}>
      {formatCurrency(display)}
    </span>
  );
}
