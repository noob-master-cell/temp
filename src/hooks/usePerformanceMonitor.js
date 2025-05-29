import { useEffect, useRef } from "react";

export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const renderTimeRef = useRef();

  useEffect(() => {
    renderCount.current += 1;
    const renderTime =
      performance.now() - (renderTimeRef.current || performance.now());
    renderTimeRef.current = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Performance] ${componentName} - Render #${
          renderCount.current
        }: ${renderTime.toFixed(2)}ms`
      );
    }

    // Report to analytics in production
    if (process.env.NODE_ENV === "production" && window.gtag) {
      window.gtag("event", "timing_complete", {
        name: `${componentName}_render`,
        value: Math.round(renderTime),
      });
    }
  });

  return renderCount.current;
};
