const BAR_WEIGHT = 20;

const PLATES = [
  { weight: 25,   color: '#D32F2F', height: 64, border: false },
  { weight: 20,   color: '#1565C0', height: 56, border: false },
  { weight: 15,   color: '#F9A825', height: 48, border: false },
  { weight: 10,   color: '#388E3C', height: 40, border: false },
  { weight: 5,    color: '#616161', height: 30, border: false },
  { weight: 2.5,  color: '#1A1A1A', height: 22, border: true  },
  { weight: 1.25, color: '#131313', height: 14, border: true  },
];

interface PlateCount {
  weight: number;
  count: number;
  color: string;
  height: number;
  border: boolean;
}

function calculate(totalWeight: number): { perSide: number; plates: PlateCount[] } {
  const perSide = Math.round(((totalWeight - BAR_WEIGHT) / 2) * 100) / 100;
  if (perSide <= 0) return { perSide: 0, plates: [] };

  let remaining = perSide;
  const plates: PlateCount[] = [];

  for (const plate of PLATES) {
    if (remaining >= plate.weight - 0.001) {
      const count = Math.floor(Math.round(remaining / plate.weight * 100) / 100);
      if (count > 0) {
        plates.push({ ...plate, count });
        remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
      }
    }
  }

  return { perSide, plates };
}

export function PlateCalculator({ weight }: { weight: number }) {
  const { perSide, plates } = calculate(weight);

  const plateDivs: React.ReactElement[] = [];
  for (const p of plates) {
    for (let i = 0; i < p.count; i++) {
      plateDivs.push(
        <div
          key={`${p.weight}-${i}`}
          className="plate-bar__plate"
          style={{
            height: p.height,
            background: p.color,
            border: p.border ? '1px solid #444' : 'none',
          }}
          title={`${p.weight}kg`}
        />
      );
    }
  }

  return (
    <div className="plate-calc">
      <div className="plate-calc__header">
        <span className="plate-calc__title">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calculate</span>
          PLATES
        </span>
        <span className="plate-calc__target">{weight}KG TOTAL</span>
      </div>

      <div className="plate-bar">
        <div className="plate-bar__collar" />
        <div className="plate-bar__plates">
          {plateDivs}
        </div>
        <div className="plate-bar__bar" />
        <div className="plate-bar__per-side">
          PER SIDE: {perSide}KG
        </div>
      </div>

      {plates.length > 0 && (
        <div className="plate-calc__tags">
          {plates.map((p) => (
            <span key={p.weight} className="plate-calc__tag">
              {p.weight}KG ×{p.count}
            </span>
          ))}
        </div>
      )}

      {plates.length === 0 && weight > 0 && (
        <p className="plate-calc__empty">Bar only ({BAR_WEIGHT}kg)</p>
      )}
    </div>
  );
}
