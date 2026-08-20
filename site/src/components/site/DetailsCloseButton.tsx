"use client";

export function DetailsCloseButton({
  label = "Hide joint details",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        const details = event.currentTarget.closest("details");
        if (!details) return;
        details.open = false;
        details.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {label}
    </button>
  );
}
