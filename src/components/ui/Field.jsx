export default function Field({ label, htmlFor, error, help, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && <p className="field__error">{error}</p>}
      {!error && help && <p className="field__help">{help}</p>}
    </div>
  );
}

export function TextInput({ id, error, ...rest }) {
  return (
    <input
      id={id}
      className={`field__input ${error ? 'field__input--error' : ''}`}
      aria-invalid={Boolean(error)}
      {...rest}
    />
  );
}
