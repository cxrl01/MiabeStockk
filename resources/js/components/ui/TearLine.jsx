export default function TearLine({ className = '' }) {
    return (
      <div
        role="separator"
        className={`h-px ${className}`}
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px)',
          backgroundSize: '12px 1px',
        }}
      />
    );
  }