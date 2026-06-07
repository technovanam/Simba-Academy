import type { CSSProperties } from "react";

type WildlifeProps = {
  className?: string;
  style?: CSSProperties;
};

/** Colorful toucan — perched or flying */
export function SvgToucan({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 80 70" className={className} style={style} aria-hidden>
      <ellipse cx="38" cy="48" rx="16" ry="14" fill="#1B1B2F" />
      <ellipse cx="38" cy="50" rx="12" ry="10" fill="#2D2D44" />
      <circle cx="48" cy="38" r="11" fill="#1B1B2F" />
      <circle cx="52" cy="36" r="3" fill="#FFF" />
      <circle cx="53" cy="36" r="1.5" fill="#1B120C" />
      <path d="M54 38 L78 42 L54 46 Z" fill="#FF6F00" />
      <path d="M54 40 L72 42 L54 44 Z" fill="#FFD54F" />
      <path d="M30 42 Q18 28 8 34 Q20 40 30 42" fill="#1B1B2F" className="jungle-wing-up" />
      <path d="M46 42 Q58 28 68 34 Q56 40 46 42" fill="#1B1B2F" className="jungle-wing-up" style={{ animationDelay: "0.1s" }} />
      <rect x="34" y="58" width="4" height="10" rx="2" fill="#FF6F00" />
      <rect x="42" y="58" width="4" height="10" rx="2" fill="#FF6F00" />
    </svg>
  );
}

/** Small songbird in flight with flapping wings */
export function SvgFlyingBird({
  className = "",
  style,
  body = "#5D4037",
  wing = "#6D4C41",
}: WildlifeProps & { body?: string; wing?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} style={style} aria-hidden>
      <ellipse cx="28" cy="22" rx="10" ry="7" fill={body} />
      <circle cx="36" cy="18" r="6" fill={body} />
      <circle cx="38" cy="17" r="1.8" fill="#FFF" />
      <circle cx="38.8" cy="17" r="0.9" fill="#1B120C" />
      <path d="M40 20 L52 18 L48 22 Z" fill="#FF8F00" />
      <g className="jungle-wing-flap" style={{ transformOrigin: "24px 20px" }}>
        <path d="M24 20 Q6 6 0 16 Q10 22 24 20" fill={wing} />
      </g>
      <g className="jungle-wing-flap" style={{ transformOrigin: "32px 20px", animationDelay: "0.12s" }}>
        <path d="M32 20 Q50 8 58 18 Q46 24 32 20" fill={wing} opacity="0.85" />
      </g>
    </svg>
  );
}

/** Cute cartoon monkey hanging from vine */
export function SvgMonkey({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 70 90" className={className} style={style} aria-hidden>
      <path
        d="M35 0 Q38 20 35 35"
        stroke="#5D4037"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="35" cy="8" rx="6" ry="3" fill="#6D4C41" />
      <path
        d="M22 32 Q12 28 10 40 Q14 48 22 44"
        fill="#8D6E63"
        stroke="#5D4037"
        strokeWidth="1.5"
        className="jungle-monkey-swing"
        style={{ transformOrigin: "35px 35px" }}
      />
      <path
        d="M48 32 Q58 28 60 40 Q56 48 48 44"
        fill="#8D6E63"
        stroke="#5D4037"
        strokeWidth="1.5"
        className="jungle-monkey-swing"
        style={{ transformOrigin: "35px 35px", animationDelay: "0.3s" }}
      />
      <circle cx="35" cy="38" r="16" fill="#A1887F" />
      <circle cx="35" cy="42" r="10" fill="#D7CCC8" />
      <circle cx="29" cy="36" r="4" fill="#FFF" />
      <circle cx="41" cy="36" r="4" fill="#FFF" />
      <circle cx="29" cy="36" r="2" fill="#3E2723" />
      <circle cx="41" cy="36" r="2" fill="#3E2723" />
      <ellipse cx="35" cy="44" rx="4" ry="3" fill="#8D6E63" />
      <path d="M32 48 Q35 52 38 48" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="52" rx="5" ry="8" fill="#8D6E63" transform="rotate(-20 20 52)" />
      <ellipse cx="50" cy="52" rx="5" ry="8" fill="#8D6E63" transform="rotate(20 50 52)" />
    </svg>
  );
}

/** Friendly jungle elephant */
export function SvgElephant({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 90 70" className={className} style={style} aria-hidden>
      <ellipse cx="45" cy="42" rx="28" ry="22" fill="#90A4AE" />
      <ellipse cx="45" cy="46" rx="20" ry="14" fill="#B0BEC5" />
      <circle cx="58" cy="30" r="14" fill="#90A4AE" />
      <circle cx="62" cy="28" r="3" fill="#37474F" />
      <path
        d="M68 32 Q82 40 78 52 Q72 48 68 38"
        fill="#90A4AE"
        className="jungle-trunk-sway"
        style={{ transformOrigin: "68px 32px" }}
      />
      <ellipse cx="32" cy="28" rx="10" ry="14" fill="#90A4AE" transform="rotate(-15 32 28)" />
      <ellipse cx="58" cy="28" rx="10" ry="14" fill="#90A4AE" transform="rotate(15 58 28)" />
      <rect x="30" y="58" width="8" height="10" rx="3" fill="#78909C" />
      <rect x="52" y="58" width="8" height="10" rx="3" fill="#78909C" />
    </svg>
  );
}

/** Bouncy jungle rabbit */
export function SvgRabbit({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 50 60" className={className} style={style} aria-hidden>
      <ellipse cx="18" cy="14" rx="5" ry="14" fill="#BCAAA4" />
      <ellipse cx="32" cy="14" rx="5" ry="14" fill="#BCAAA4" />
      <ellipse cx="18" cy="14" rx="3" ry="10" fill="#FFCCBC" />
      <ellipse cx="32" cy="14" rx="3" ry="10" fill="#FFCCBC" />
      <circle cx="25" cy="36" r="16" fill="#D7CCC8" />
      <circle cx="25" cy="40" r="10" fill="#FFF8F5" />
      <circle cx="20" cy="34" r="2.5" fill="#3E2723" />
      <circle cx="30" cy="34" r="2.5" fill="#3E2723" />
      <ellipse cx="25" cy="40" rx="3" ry="2" fill="#FFAB91" />
      <ellipse cx="14" cy="48" rx="6" ry="4" fill="#D7CCC8" />
      <ellipse cx="36" cy="48" rx="6" ry="4" fill="#D7CCC8" />
      <circle cx="25" cy="52" r="5" fill="#FFF8F5" />
    </svg>
  );
}

/** Slow turtle on the forest floor */
export function SvgTurtle({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 70 45" className={className} style={style} aria-hidden>
      <ellipse cx="38" cy="26" rx="24" ry="16" fill="#558B2F" />
      <ellipse cx="38" cy="24" rx="18" ry="12" fill="#689F38" />
      <path
        d="M28 20 L38 14 L48 20 L48 30 L38 36 L28 30 Z"
        fill="#33691E"
        opacity="0.5"
      />
      <ellipse cx="14" cy="28" rx="8" ry="6" fill="#7CB342" />
      <circle cx="10" cy="26" r="2" fill="#1B5E20" />
      <ellipse cx="58" cy="30" rx="5" ry="3" fill="#7CB342" transform="rotate(20 58 30)" />
      <ellipse cx="64" cy="32" rx="5" ry="3" fill="#7CB342" transform="rotate(-10 64 32)" />
      <ellipse cx="28" cy="38" rx="4" ry="2.5" fill="#558B2F" />
      <ellipse cx="48" cy="38" rx="4" ry="2.5" fill="#558B2F" />
    </svg>
  );
}

/** Bright tree frog */
export function SvgFrog({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 50 40" className={className} style={style} aria-hidden>
      <ellipse cx="25" cy="28" rx="18" ry="12" fill="#43A047" />
      <ellipse cx="25" cy="30" rx="12" ry="8" fill="#66BB6A" />
      <circle cx="16" cy="18" r="9" fill="#43A047" />
      <circle cx="34" cy="18" r="9" fill="#43A047" />
      <circle cx="16" cy="16" r="5" fill="#FFF59D" />
      <circle cx="34" cy="16" r="5" fill="#FFF59D" />
      <circle cx="16" cy="16" r="2.5" fill="#1B5E20" />
      <circle cx="34" cy="16" r="2.5" fill="#1B5E20" />
      <path d="M22 32 Q25 35 28 32" stroke="#2E7D32" strokeWidth="1.5" fill="none" />
      <ellipse cx="12" cy="34" rx="4" ry="2" fill="#388E3C" />
      <ellipse cx="38" cy="34" rx="4" ry="2" fill="#388E3C" />
    </svg>
  );
}

/** Tropical hibiscus flower */
export function SvgHibiscus({ className = "", style, color = "#E91E63" }: WildlifeProps & { color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden>
      <circle cx="20" cy="20" r="5" fill="#FFD54F" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="12"
          rx="6"
          ry="12"
          fill={color}
          transform={`rotate(${deg} 20 20)`}
          opacity="0.9"
        />
      ))}
    </svg>
  );
}

/** Layered jungle hills + forest silhouette */
export function SvgJungleHorizon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      className={`absolute bottom-0 left-0 w-full h-36 md:h-48 ${className}`}
      aria-hidden
    >
      <path
        d="M0 200 L0 120 Q200 80 400 110 Q600 140 800 90 Q1000 50 1200 100 L1200 200 Z"
        fill="#2D6A4F"
        opacity="0.35"
      />
      <path
        d="M0 200 L0 140 Q150 100 300 130 Q500 160 700 110 Q900 70 1200 120 L1200 200 Z"
        fill="#1B4332"
        opacity="0.5"
      />
      <path
        d="M0 200 L0 160 Q100 130 250 150 Q400 170 550 140 Q700 110 900 150 Q1050 170 1200 145 L1200 200 Z"
        fill="#081C15"
        opacity="0.55"
      />
      {/* Tree silhouettes */}
      <path d="M80 200 L80 100 Q95 60 110 100 L110 200" fill="#0D2818" />
      <path d="M75 95 Q92 45 110 95 Q92 75 75 95" fill="#1B4332" />
      <path d="M200 200 L200 80 Q220 40 240 80 L240 200" fill="#0D2818" />
      <path d="M195 75 Q218 25 240 75 Q218 55 195 75" fill="#2D6A4F" />
      <path d="M450 200 L450 90 Q470 50 490 90 L490 200" fill="#0D2818" />
      <path d="M445 85 Q468 35 490 85 Q468 65 445 85" fill="#1B4332" />
      <path d="M700 200 L700 70 Q725 20 750 70 L750 200" fill="#0D2818" />
      <path d="M693 65 Q724 10 750 65 Q724 42 693 65" fill="#2D6A4F" />
      <path d="M950 200 L950 95 Q970 55 990 95 L990 200" fill="#0D2818" />
      <path d="M945 90 Q968 40 990 90 Q968 70 945 90" fill="#1B4332" />
      <path d="M1100 200 L1100 110 Q1118 70 1135 110 L1135 200" fill="#0D2818" />
      <path d="M1095 105 Q1116 55 1135 105 Q1116 82 1095 105" fill="#2D6A4F" />
      {/* Palm */}
      <path d="M600 200 L600 60 L590 200" fill="#5D4037" stroke="#4E342E" strokeWidth="2" />
      <path d="M600 55 Q560 40 540 60 Q580 50 600 55" fill="#2D6A4F" />
      <path d="M600 55 Q640 40 660 60 Q620 50 600 55" fill="#40916C" />
      <path d="M600 50 Q570 25 555 45 Q590 35 600 50" fill="#52B788" />
      <path d="M600 50 Q630 25 645 45 Q610 35 600 50" fill="#2D6A4F" />
      <path d="M600 48 Q600 15 600 5 Q615 30 600 48" fill="#1B4332" />
    </svg>
  );
}

/** Hanging vines on left/right edges */
export function SvgVineBorder({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? "scale-x-[-1]" : "";
  return (
    <svg
      viewBox="0 0 60 400"
      className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} h-full w-10 md:w-14 opacity-70 pointer-events-none z-[2] ${flip}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M30 0 Q25 80 32 160 Q20 240 30 320 Q22 380 30 400"
        stroke="#33691E"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 0 Q38 100 28 200 Q40 300 30 400"
        stroke="#558B2F"
        strokeWidth="2.5"
        fill="none"
        opacity="0.6"
      />
      <ellipse cx="22" cy="60" rx="10" ry="6" fill="#43A047" transform="rotate(-30 22 60)" className="jungle-leaf-sway" />
      <ellipse cx="38" cy="140" rx="12" ry="7" fill="#66BB6A" transform="rotate(20 38 140)" className="jungle-leaf-sway" style={{ animationDelay: "1s" }} />
      <ellipse cx="18" cy="220" rx="11" ry="6" fill="#2E7D32" transform="rotate(-15 18 220)" className="jungle-leaf-sway" style={{ animationDelay: "2s" }} />
      <ellipse cx="36" cy="300" rx="10" ry="6" fill="#43A047" transform="rotate(25 36 300)" className="jungle-leaf-sway" style={{ animationDelay: "0.5s" }} />
      <ellipse cx="24" cy="360" rx="9" ry="5" fill="#66BB6A" transform="rotate(-20 24 360)" className="jungle-leaf-sway" style={{ animationDelay: "1.5s" }} />
    </svg>
  );
}

/** Rich sun with rays */
export function SvgJungleSun({ className = "", style }: WildlifeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="22" fill="#FFD54F" />
      <circle cx="50" cy="50" r="18" fill="#FFEE58" opacity="0.8" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2="50"
          y2="8"
          stroke="#FFB300"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${i * 30} 50 50)`}
          opacity="0.7"
        />
      ))}
    </svg>
  );
}

/** Soft mist drifting through the forest */
export function SvgMistLayers({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="40%" stopColor="rgba(230,245,235,0.12)" />
          <stop offset="70%" stopColor="rgba(200,230,210,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="1200" height="400" fill="url(#mistGrad)" className="jungle-mist-drift" />
      <ellipse cx="300" cy="280" rx="280" ry="60" fill="rgba(255,255,255,0.06)" />
      <ellipse cx="800" cy="320" rx="350" ry="70" fill="rgba(255,255,255,0.05)" />
      <ellipse cx="550" cy="200" rx="200" ry="40" fill="rgba(255,255,255,0.04)" />
    </svg>
  );
}

/** Sunlight filtering through the canopy */
export function SvgLightShafts({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="none"
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,248,220,0.14)" />
          <stop offset="100%" stopColor="rgba(255,248,220,0)" />
        </linearGradient>
      </defs>
      <path d="M200 0 L260 600 L180 600 Z" fill="url(#shaft)" opacity="0.5" />
      <path d="M520 0 L580 600 L460 600 Z" fill="url(#shaft)" opacity="0.35" />
      <path d="M880 0 L940 600 L820 600 Z" fill="url(#shaft)" opacity="0.4" />
    </svg>
  );
}

/** Dark overhead canopy — natural fern fronds */
export function SvgNaturalCanopyShadow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 180"
      preserveAspectRatio="none"
      className={`absolute top-0 left-0 w-full h-28 md:h-36 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="canopyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1610" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0a1610" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="180" fill="url(#canopyFade)" />
      <path d="M0 0 Q80 60 40 120 Q120 80 160 0" fill="#132218" opacity="0.7" />
      <path d="M120 0 Q200 70 160 130 Q240 90 280 0" fill="#1a2e1f" opacity="0.65" />
      <path d="M400 0 Q480 55 440 110 Q520 75 560 0" fill="#132218" opacity="0.6" />
      <path d="M700 0 Q780 65 740 125 Q820 85 860 0" fill="#1a2e1f" opacity="0.7" />
      <path d="M1000 0 Q1080 50 1040 100 Q1120 70 1200 0" fill="#132218" opacity="0.65" />
      <path d="M900 0 Q960 40 920 80 Q980 55 1020 0" fill="#0f1f14" opacity="0.5" />
    </svg>
  );
}

/** Distant birds on the horizon — tiny silhouettes */
export function SvgDistantBirdFlock({ className = "" }: { className?: string }) {
  const birds = [
    { x: 120, y: 45, s: 1 },
    { x: 145, y: 42, s: 0.8 },
    { x: 168, y: 48, s: 0.9 },
    { x: 520, y: 38, s: 1 },
    { x: 540, y: 35, s: 0.7 },
    { x: 850, y: 50, s: 0.9 },
    { x: 870, y: 47, s: 0.75 },
  ];
  return (
    <svg viewBox="0 0 1200 80" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      {birds.map((b, i) => (
        <path
          key={i}
          d={`M${b.x} ${b.y} Q${b.x + 4 * b.s} ${b.y - 3 * b.s} ${b.x + 8 * b.s} ${b.y} Q${b.x + 12 * b.s} ${b.y + 3 * b.s} ${b.x + 16 * b.s} ${b.y}`}
          stroke="#1a2e22"
          strokeWidth="1.2"
          fill="none"
          opacity="0.35"
        />
      ))}
    </svg>
  );
}

/** Natural flying bird — dark silhouette only */
export function SvgBirdSilhouette({
  className = "",
  style,
  size = 1,
}: WildlifeProps & { size?: number }) {
  const w = 24 * size;
  const h = 10 * size;
  return (
    <svg viewBox="0 0 24 10" width={w} height={h} className={className} style={style} aria-hidden>
      <path
        d="M2 5 Q6 1 12 5 Q18 1 22 5"
        stroke="#1c3024"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        className="jungle-wing-silhouette"
      />
    </svg>
  );
}

/** Natural forest floor blend */
export function SvgForestFloor({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={`absolute bottom-0 left-0 w-full h-24 md:h-32 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3328" stopOpacity="0" />
          <stop offset="50%" stopColor="#142820" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0d1f16" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <rect width="1200" height="120" fill="url(#floorGrad)" />
      <path d="M0 80 Q150 60 300 75 Q450 90 600 65 Q750 50 900 70 Q1050 85 1200 60 L1200 120 L0 120 Z" fill="#0f2218" opacity="0.3" />
    </svg>
  );
}

/** Mini jungle scene for hero banner */
export function SvgHeroJungleScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#81D4FA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#A5D6A7" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#heroSky)" rx="12" />
      <circle cx="165" cy="28" r="16" fill="#FFD54F" opacity="0.9" />
      <path d="M0 120 L0 70 Q50 50 100 75 Q150 95 200 60 L200 120 Z" fill="#2D6A4F" opacity="0.6" />
      <path d="M0 120 L0 85 Q60 65 120 80 Q160 90 200 75 L200 120 Z" fill="#1B4332" opacity="0.7" />
      <g transform="translate(30 55)">
        <SvgToucan className="w-12 h-10" />
      </g>
      <g transform="translate(120 40)" className="jungle-bird-fly-slow">
        <SvgFlyingBird className="w-10 h-6" body="#FF6F00" wing="#FF8F00" />
      </g>
      <g transform="translate(145 75)">
        <SvgFrog className="w-8 h-6 jungle-hop" />
      </g>
      <g transform="translate(55 82)">
        <SvgRabbit className="w-7 h-8 jungle-hop" style={{ animationDelay: "0.8s" }} />
      </g>
      <g transform="translate(8 25)">
        <ellipse cx="8" cy="6" rx="6" ry="4" fill="#E91E63" transform="rotate(-20 8 6)" opacity="0.8" />
        <ellipse cx="14" cy="8" rx="5" ry="3" fill="#FF7043" transform="rotate(15 14 8)" opacity="0.7" />
      </g>
    </svg>
  );
}
