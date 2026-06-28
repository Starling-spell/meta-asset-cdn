"use client";

/** Small pill showing whether the app runs against mock storage or the real Shelby network. */
export function ModeBadge() {
  const real = process.env.NEXT_PUBLIC_SHELBY_MODE === "real";
  return (
    <span
      className={`badge ${real ? "badge-accent2" : "badge-accent"}`}
      title={
        real
          ? "Connected to the real Shelby network"
          : "Demo mode — blobs are stored in-memory, no wallet or credentials needed"
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${real ? "bg-accent2" : "bg-accent"}`} />
      {real ? "Live: Shelby" : "Demo mode"}
    </span>
  );
}
