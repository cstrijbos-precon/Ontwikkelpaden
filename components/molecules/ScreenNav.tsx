interface ScreenNavProps {
  huidig: number;
  onTerug: () => void;
  onVolgende: () => void;
}

export function ScreenNav({ huidig, onTerug, onVolgende }: ScreenNavProps) {
  return (
    <div className="nav-knoppen">
      {huidig > 0 ? (
        <button type="button" className="btn btn-t" onClick={onTerug}>
          ← Terug
        </button>
      ) : (
        <span />
      )}
      {huidig < 8 ? (
        <button type="button" className="btn btn-v" onClick={onVolgende}>
          Volgende →
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-v"
          onClick={() => window.print()}
        >
          🖨 Afdrukken
        </button>
      )}
    </div>
  );
}
