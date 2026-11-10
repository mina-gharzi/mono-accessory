"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

type HeroMediaProps = {
  desktopSrcSet?: string;
  mobile: ComponentProps<"img">;
};

export function HeroMedia({ desktopSrcSet, mobile }: HeroMediaProps) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return null;
  }

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
      <img
        {...mobile}
        ref={imageRef}
        alt=""
        onError={() => setFailed(true)}
        className="absolute inset-0 size-full object-cover"
      />
    </picture>
  );
}
