import "../style.css";

export function ErrorBox({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <div role="alert" className="error">
      {text}
      {retry && <button onClick={retry}>Спробувати знову</button>}
    </div>
  );
}