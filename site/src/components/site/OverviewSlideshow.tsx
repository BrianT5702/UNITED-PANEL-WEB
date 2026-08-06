"use client";

import { useEffect, useState } from "react";

export function OverviewSlideshow({
  images,
  startIndex = 0,
  intervalMs = 4500,
  label = "Project photos",
}: {
  images: string[];
  startIndex?: number;
  intervalMs?: number;
  label?: string;
}) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(() =>
    slides.length ? ((startIndex % slides.length) + slides.length) % slides.length : 0,
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!slides.length) {
    return <span>Photo</span>;
  }

  return (
    <div className="overview-slideshow" aria-roledescription="carousel" aria-label={label}>
      {slides.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className={i === index ? "is-active" : undefined}
        />
      ))}
      {slides.length > 1 ? (
        <div className="overview-slideshow-dots" aria-hidden="true">
          {slides.map((src, i) => (
            <button
              key={src}
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
