"use client";

import { useEffect, useState } from "react";
import { imageFocusStyle, type ImageFocus } from "@/lib/page-document";

export type SlideshowImage = string | { src: string; focus?: ImageFocus };

function slideSrc(item: SlideshowImage): string {
  return typeof item === "string" ? item : item.src;
}

function slideFocus(item: SlideshowImage): ImageFocus | undefined {
  return typeof item === "string" ? undefined : item.focus;
}

export function OverviewSlideshow({
  images,
  startIndex = 0,
  intervalMs = 4500,
  label = "Project photos",
}: {
  images: SlideshowImage[];
  startIndex?: number;
  intervalMs?: number;
  label?: string;
}) {
  const slides = images.filter((item) => Boolean(slideSrc(item)));
  const [index, setIndex] = useState(() =>
    slides.length ? ((startIndex % slides.length) + slides.length) % slides.length : 0,
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const ms = Math.max(1000, intervalMs || 4500);
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!slides.length) {
    return <span>Photo</span>;
  }

  return (
    <div className="overview-slideshow" aria-roledescription="carousel" aria-label={label}>
      {slides.map((item, i) => {
        const src = slideSrc(item);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            className={i === index ? "is-active" : undefined}
            style={imageFocusStyle(slideFocus(item))}
          />
        );
      })}
      {slides.length > 1 ? (
        <div className="overview-slideshow-dots" aria-hidden="true">
          {slides.map((item, i) => (
            <button
              key={`${slideSrc(item)}-dot-${i}`}
              type="button"
              className={i === index ? "is-active" : undefined}
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
