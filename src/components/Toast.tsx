export default function Toast({ message }: { message: string | null }) {
  // Always mounted so assistive tech announces text changes in the live region.
  return (
    <div className="toast" role="status" aria-live="polite" data-show={message !== null}>
      {message}
    </div>
  );
}
