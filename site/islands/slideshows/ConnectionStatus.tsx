import { connectionStatus } from "./SlideshowSync.tsx";

export default function ConnectionStatus() {
  const showLabel = false;
  const status = connectionStatus.value;
  const colours: Record<string, string> = {
    connected: "#22c55e",
    reconnecting: "#f59e0b",
    offline: "#6b7280",
  };
  const labels: Record<string, string> = {
    connected: "Live",
    reconnecting: "Reconnecting…",
    offline: "Offline",
  };
  return (
    <div
      style={`position:fixed;display:flex;align-items:center;gap:0.4rem;padding:0.25rem 0.6rem;${
        showLabel
          ? "bottom:0.65rem;right:0.95rem;border-radius:999px;background:rgba(0,0,0,0.5);color:white;"
          : "bottom:0.95rem;right:0.85rem;"
      }font-size:0.7rem;z-index:100;`}
      title={labels[status]}
    >
      <span
        style={`width:7px;height:7px;border-radius:50%;background:${
          colours[status]
        };display:inline-block;`}
      />
      {showLabel && labels[status]}
    </div>
  );
}
