/** Small message box. type = "success" | "error" | "info" */
export default function Alert({ msg, onClose }) {
  if (!msg || !msg.text) return null;
  return (
    <div className={`alert alert-${msg.type || 'info'}`}>
      <span>{msg.text}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          x
        </button>
      )}
    </div>
  );
}
