export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#08090D",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(139,92,246,0.15))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <path d="M6 22L12 14L18 18L26 8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="26" cy="8" r="2.5" fill="#34D399" />
        </svg>
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid #10B981",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#71717A", fontSize: 13 }}>Memuat Finance Tracker...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
