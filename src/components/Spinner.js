export default function Spinner({ className = 'h-4 w-4' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-middle ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
