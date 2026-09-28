"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { htmlToPlainText } from "@/lib/sanitize-html";

export type LogoSlide = { id: string; src: string; alt: string };

type Props = {
  slides: LogoSlide[];
  label: string;
  intervalMs: number;
  autoplay: boolean;
  /** Admin preview: jump to this slide (e.g. the one being edited) */
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
};

/**
 * Slideshow of wide images shown whole (never cropped), e.g. several brand logos per slide.
 * Auto-advances (optional), pauses on hover / keyboard focus / hidden tab,
 * with arrows, dots, swipe and ←/→ keys. Same component on the live page and in the editor.
 */
export function LogoSlideshow({ slides, label, intervalMs, autoplay, activeIndex, onIndexChange }: Props) {
  const list = slides.filter((s) => Boolean(s.src));
  const count = list.length;
  const [index, setIndexState] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const setIndex = useCallback(
    (next: number) => {
      if (!count) return;
      const i = ((next % count) + count) % count;
      setIndexState(i);
      onIndexChange?.(i);
    },
    [count, onIndexChange],
  );

  useEffect(() => {
    if (activeIndex != null && count) setIndexState(((activeIndex % count) + count) % count);
  }, [activeIndex, count]);

  // Keep the index valid when slides are removed
  useEffect(() => {
    if (index >= count && count) setIndexState(count - 1);
  }, [count, index]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!autoplay || paused || reduceMotion || count < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndexState((i) => (i + 1) % count);
    }, Math.max(1500, intervalMs));
    return () => window.clearInterval(id);
  }, [autoplay, paused, reduceMotion, count, intervalMs]);

  if (!count) {
    return <div className="logo-slides logo-slides-empty">Add a slide image to start the slideshow.</div>;
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex(index + 1);
    }
  };
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
    setPaused(true);
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    setPaused(false);
    if (start == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) > 40) setIndex(dx < 0 ? index + 1 : index - 1);
  };

  const caption = htmlToPlainText(list[index]?.alt || "");

  return (
    <div
      className="logo-slides"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="logo-slides-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="logo-slides-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {list.map((slide, i) => (
            <div
              className={`logo-slides-slide${i === index ? " is-active" : ""}`}
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.src} alt={htmlToPlainText(slide.alt || label)} loading={i === 0 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
        {count > 1 ? (
          <>
            <button
              type="button"
              className="logo-slides-arrow is-prev"
              onClick={() => setIndex(index - 1)}
              aria-label="Previous slide"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="logo-slides-arrow is-next"
              onClick={() => setIndex(index + 1)}
              aria-label="Next slide"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        ) : null}
      </div>
      <div className="logo-slides-foot">
        <p className="logo-slides-caption" aria-live="polite">
          {caption}
        </p>
        {count > 1 ? (
          <div className="logo-slides-dots">
            {list.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className={i === index ? "is-active" : undefined}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
