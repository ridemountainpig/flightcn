/** Static diagrams distinguish the two APIs without loading extra WebGL maps. */
export function ProductDiagram({ satellite }: { satellite: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`mb-6 flex h-36 items-center justify-center overflow-hidden rounded-xl ${satellite ? "bg-slate-950 text-[#9caec4]" : "bg-slate-50 text-orange-700"}`}
    >
      <svg viewBox="0 0 480 144" className="h-full w-full" fill="none">
        {[80, 160, 240, 320, 400].map((x) => (
          <path key={x} d={`M${x} 0V144`} stroke="currentColor" opacity=".07" />
        ))}
        {[36, 72, 108].map((y) => (
          <path key={y} d={`M0 ${y}H480`} stroke="currentColor" opacity=".07" />
        ))}
        {satellite ? (
          <g transform="translate(240 72)">
            <circle r="47" stroke="currentColor" opacity=".5" />
            <ellipse rx="20" ry="47" stroke="currentColor" opacity=".3" />
            <ellipse rx="47" ry="17" stroke="currentColor" opacity=".3" />
            <ellipse
              rx="94"
              ry="29"
              transform="rotate(-22)"
              stroke="#e1a677"
              strokeWidth="1.5"
            />
            <circle cx="79" cy="-40" r="4" fill="#e1a677" />
          </g>
        ) : (
          <g>
            <path
              d="M72 104Q238 -40 408 104"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M72 104H408"
              stroke="currentColor"
              strokeDasharray="3 5"
              opacity=".3"
            />
            <circle cx="72" cy="104" r="4" fill="currentColor" />
            <circle cx="408" cy="104" r="4" fill="currentColor" />
            <text
              x="60"
              y="126"
              fill="currentColor"
              fontSize="10"
              fontFamily="monospace"
            >
              TPE
            </text>
            <text
              x="396"
              y="126"
              fill="currentColor"
              fontSize="10"
              fontFamily="monospace"
            >
              HND
            </text>
            <path
              d="m235 30 2-10 3 0 2 10 11 6v3l-11-3-1 9 4 3v2l-7-2-7 2v-2l4-3-1-9-11 3v-3z"
              fill="currentColor"
              transform="rotate(85 238 34)"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
