import { useEffect, useRef, useState } from "react";

export const useImageLazyLoad = (src, placeholder) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const onLoad = () => {
    setIsLoaded(true);
    setImageSrc(src);
  };

  const onError = () => {
    setIsError(true);
  };

  useEffect(() => {
    if (!imageRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            imageRef.src = src;
            observer.unobserve(imageRef);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imageRef) {
      observer.observe(imageRef);
    }

    return () => {
      if (imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src]);

  return {
    imageSrc,
    setImageRef,
    isLoaded,
    isError,
    onLoad,
    onError,
  };
};
