import { memo } from 'react';

export type PandaAnimationState =
  | 'idle'
  | 'breathing'
  | 'eating'
  | 'shadow_hiding'
  | 'lens_inspecting'
  | 'note_writing'
  | 'upside_down'
  | 'animal_sorting'
  | 'deep_drilling'
  | 'big_ears_fanning'
  | 'plant_foraging';

interface PandaCompanionProps {
  state?: PandaAnimationState;
  className?: string;
}

function PandaCompanionInner({ state = 'idle', className = '' }: PandaCompanionProps) {
  const stateClass = `panda-${state}`;

  return (
    <div
      className={`panda-canvas ${stateClass} ${className}`}
      aria-hidden="true"
      role="img"
      aria-label={`Panda companion — ${state}`}
    >
      <svg
        viewBox="0 0 180 320"
        className="panda-svg"
        preserveAspectRatio="xMidYMax meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ===== Props layer (varies by state) ===== */}
        {/* Sun for shadow_hiding */}
        <g className="panda-prop panda-prop-sun">
          <circle cx="145" cy="40" r="18" fill="#fbbf24" opacity="0.9" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1="145"
              y1="40"
              x2={145 + Math.cos((i * Math.PI) / 4) * 26}
              y2={40 + Math.sin((i * Math.PI) / 4) * 26}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.7"
            />
          ))}
        </g>

        {/* Rock for shadow_hiding */}
        <g className="panda-prop panda-prop-rock">
          <ellipse cx="90" cy="265" rx="60" ry="22" fill="#9ca3af" opacity="0.85" />
          <ellipse cx="90" cy="260" rx="52" ry="18" fill="#a8a29e" opacity="0.8" />
        </g>

        {/* Carrot for eating */}
        <g className="panda-prop panda-prop-carrot">
          <path d="M 70 200 L 78 230 L 86 200 Z" fill="#f97316" />
          <path d="M 72 198 Q 74 190 76 196 Q 78 188 80 196 Q 82 190 84 198" fill="#22c55e" stroke="none" />
        </g>

        {/* Magnifying glass for lens_inspecting */}
        <g className="panda-prop panda-prop-lens">
          <circle cx="120" cy="120" r="16" fill="none" stroke="#6b7280" strokeWidth="3" opacity="0.7" />
          <circle cx="120" cy="120" r="14" fill="#bfdbfe" opacity="0.25" />
          <line x1="131" y1="131" x2="142" y2="142" stroke="#6b7280" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Glasses for note_writing */}
        <g className="panda-prop panda-prop-glasses">
          <circle cx="62" cy="115" r="10" fill="none" stroke="#374151" strokeWidth="2.5" />
          <circle cx="92" cy="115" r="10" fill="none" stroke="#374151" strokeWidth="2.5" />
          <line x1="72" y1="115" x2="82" y2="115" stroke="#374151" strokeWidth="2.5" />
        </g>

        {/* Notebook for note_writing */}
        <g className="panda-prop panda-prop-notebook">
          <rect x="105" y="195" width="30" height="38" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          <line x1="110" y1="205" x2="130" y2="205" stroke="#d97706" strokeWidth="1" opacity="0.5" />
          <line x1="110" y1="212" x2="130" y2="212" stroke="#d97706" strokeWidth="1" opacity="0.5" />
          <line x1="110" y1="219" x2="130" y2="219" stroke="#d97706" strokeWidth="1" opacity="0.5" />
        </g>

        {/* Pencil for note_writing */}
        <g className="panda-prop panda-prop-pencil">
          <rect x="100" y="188" width="22" height="4" rx="1" fill="#fbbf24" transform="rotate(-20 111 190)" />
          <polygon points="122,186 128,184 126,190" fill="#374151" transform="rotate(-20 111 190)" />
        </g>

        {/* Leaf for note_writing */}
        <g className="panda-prop panda-prop-leaf">
          <path d="M 40 170 Q 30 160 35 150 Q 50 155 48 170 Z" fill="#22c55e" opacity="0.8" />
          <line x1="42" y1="168" x2="36" y2="155" stroke="#15803d" strokeWidth="0.8" />
        </g>

        {/* Big ears for big_ears_fanning */}
        <g className="panda-prop panda-prop-big-ears">
          {/* Left big ear */}
          <ellipse cx="38" cy="75" rx="22" ry="32" fill="#1f2937" opacity="0.9" />
          <ellipse cx="38" cy="78" rx="14" ry="22" fill="#4b5563" />
          {/* Right big ear */}
          <ellipse cx="122" cy="75" rx="22" ry="32" fill="#1f2937" opacity="0.9" />
          <ellipse cx="122" cy="78" rx="14" ry="22" fill="#4b5563" />
        </g>

        {/* Fruit basket for plant_foraging */}
        <g className="panda-prop panda-prop-basket">
          <path d="M 95 220 Q 95 235 110 235 Q 125 235 125 220 Z" fill="#d97706" />
          <circle cx="105" cy="218" r="5" fill="#ef4444" />
          <circle cx="115" cy="218" r="5" fill="#f97316" />
          <circle cx="110" cy="213" r="4" fill="#fbbf24" />
        </g>

        {/* Palm tree for plant_foraging */}
        <g className="panda-prop panda-prop-palm">
          <line x1="150" y1="250" x2="150" y2="180" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
          <path d="M 150 180 Q 135 168 125 175 Q 140 178 150 180" fill="#22c55e" />
          <path d="M 150 180 Q 165 168 175 175 Q 160 178 150 180" fill="#22c55e" />
          <path d="M 150 180 Q 145 165 155 155 Q 152 170 150 180" fill="#22c55e" />
          <circle cx="150" cy="185" r="3" fill="#92400e" />
          <circle cx="147" cy="188" r="2.5" fill="#92400e" />
        </g>

        {/* Lotus flower for plant_foraging */}
        <g className="panda-prop panda-prop-lotus">
          <ellipse cx="30" cy="270" rx="12" ry="6" fill="#bfdbfe" opacity="0.5" />
          {Array.from({ length: 6 }).map((_, i) => (
            <ellipse
              key={i}
              cx="30"
              cy="262"
              rx="4"
              ry="9"
              fill="#fbcfe8"
              opacity="0.8"
              transform={`rotate(${i * 60} 30 265)`}
            />
          ))}
          <circle cx="30" cy="265" r="3" fill="#fbbf24" />
        </g>

        {/* Water drop for deep_drilling */}
        <g className="panda-prop panda-prop-water">
          <path d="M 120 200 Q 115 210 120 215 Q 125 210 120 200 Z" fill="#3b82f6" opacity="0.7" />
          <circle cx="120" cy="218" r="2" fill="#93c5fd" opacity="0.5" />
          <circle cx="116" cy="222" r="1.5" fill="#93c5fd" opacity="0.4" />
        </g>

        {/* Roots for deep_drilling */}
        <g className="panda-prop panda-prop-roots">
          <path d="M 90 280 Q 85 295 80 305 M 90 280 Q 95 295 100 305 M 90 280 Q 88 295 75 308 M 90 280 Q 92 295 105 308"
            fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <circle cx="80" cy="306" r="3" fill="#3b82f6" opacity="0.5" />
          <circle cx="100" cy="306" r="3" fill="#3b82f6" opacity="0.5" />
        </g>

        {/* Sorting cards for animal_sorting */}
        <g className="panda-prop panda-prop-cards">
          <rect x="20" y="55" width="28" height="22" rx="4" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
          <rect x="76" y="55" width="28" height="22" rx="4" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="132" y="55" width="28" height="22" rx="4" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1.5" />
          <text x="34" y="70" fontSize="10" textAnchor="middle" fill="#1e40af">A</text>
          <text x="90" y="70" fontSize="10" textAnchor="middle" fill="#92400e">B</text>
          <text x="146" y="70" fontSize="10" textAnchor="middle" fill="#15803d">C</text>
        </g>

        {/* ===== Panda body (always present) ===== */}
        <g className="panda-body-group">
          {/* Legs */}
          <g className="panda-legs">
            {/* Left leg */}
            <ellipse className="panda-leg-left" cx="68" cy="278" rx="16" ry="14" fill="#1f2937" />
            <ellipse cx="68" cy="282" rx="12" ry="8" fill="#374151" />
            {/* Right leg */}
            <ellipse className="panda-leg-right" cx="98" cy="278" rx="16" ry="14" fill="#1f2937" />
            <ellipse cx="98" cy="282" rx="12" ry="8" fill="#374151" />
          </g>

          {/* Arms */}
          <g className="panda-arms">
            {/* Left arm */}
            <ellipse className="panda-arm-left" cx="52" cy="220" rx="12" ry="24" fill="#1f2937" transform="rotate(15 52 220)" />
            <circle cx="48" cy="240" r="9" fill="#1f2937" />
            {/* Right arm */}
            <ellipse className="panda-arm-right" cx="118" cy="220" rx="12" ry="24" fill="#1f2937" transform="rotate(-15 118 220)" />
            <circle cx="122" cy="240" r="9" fill="#1f2937" />
          </g>

          {/* Torso */}
          <ellipse className="panda-torso" cx="83" cy="235" rx="32" ry="42" fill="#f9fafb" />
          {/* Belly patch */}
          <ellipse className="panda-belly" cx="83" cy="240" rx="22" ry="30" fill="#f3f4f6" />

          {/* Black shoulder patches */}
          <ellipse cx="60" cy="210" rx="14" ry="18" fill="#1f2937" transform="rotate(20 60 210)" />
          <ellipse cx="106" cy="210" rx="14" ry="18" fill="#1f2937" transform="rotate(-20 106 210)" />

          {/* Head */}
          <g className="panda-head-group">
            {/* Ears */}
            <ellipse className="panda-ear-left" cx="55" cy="95" rx="14" ry="18" fill="#1f2937" />
            <ellipse className="panda-ear-right" cx="111" cy="95" rx="14" ry="18" fill="#1f2937" />
            <ellipse cx="55" cy="98" rx="8" ry="11" fill="#4b5563" />
            <ellipse cx="111" cy="98" rx="8" ry="11" fill="#4b5563" />

            {/* Head shape */}
            <circle className="panda-head" cx="83" cy="125" r="38" fill="#f9fafb" />

            {/* Eye patches (black) */}
            <ellipse className="panda-eye-patch-left" cx="68" cy="120" rx="12" ry="16" fill="#1f2937" transform="rotate(-15 68 120)" />
            <ellipse className="panda-eye-patch-right" cx="98" cy="120" rx="12" ry="16" fill="#1f2937" transform="rotate(15 98 120)" />

            {/* Eyes */}
            <g className="panda-eyes">
              {/* Left eye */}
              <circle className="panda-eye-left" cx="70" cy="122" r="5" fill="#ffffff" />
              <circle cx="71" cy="123" r="3" fill="#1f2937" />
              <circle cx="72" cy="122" r="1" fill="#ffffff" />
              {/* Right eye */}
              <circle className="panda-eye-right" cx="96" cy="122" r="5" fill="#ffffff" />
              <circle cx="97" cy="123" r="3" fill="#1f2937" />
              <circle cx="98" cy="122" r="1" fill="#ffffff" />
            </g>

            {/* Eyelids (for blinking) */}
            <rect className="panda-eyelid-left" x="64" y="116" width="13" height="0" fill="#1f2937" rx="2" />
            <rect className="panda-eyelid-right" x="90" y="116" width="13" height="0" fill="#1f2937" rx="2" />

            {/* Nose */}
            <ellipse cx="83" cy="135" rx="5" ry="3.5" fill="#1f2937" />
            {/* Mouth */}
            <path className="panda-mouth" d="M 78 142 Q 83 147 88 142" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />

            {/* Cheeks (blush) */}
            <circle className="panda-cheek-left" cx="60" cy="138" r="5" fill="#fbcfe8" opacity="0.5" />
            <circle className="panda-cheek-right" cx="106" cy="138" r="5" fill="#fbcfe8" opacity="0.5" />
          </g>
        </g>

        {/* ===== Particles layer ===== */}
        {/* Bubbles for breathing */}
        <g className="panda-particles panda-particles-bubbles">
          <circle className="panda-bubble panda-bubble-1" cx="60" cy="170" r="4" fill="#bfdbfe" opacity="0" />
          <circle className="panda-bubble panda-bubble-2" cx="50" cy="165" r="3" fill="#bfdbfe" opacity="0" />
          <circle className="panda-bubble panda-bubble-3" cx="105" cy="170" r="3.5" fill="#bfdbfe" opacity="0" />
        </g>

        {/* Crumbs for eating */}
        <g className="panda-particles panda-particles-crumbs">
          <circle className="panda-crumb panda-crumb-1" cx="75" cy="210" r="2" fill="#f97316" opacity="0" />
          <circle className="panda-crumb panda-crumb-2" cx="82" cy="215" r="1.5" fill="#fb923c" opacity="0" />
          <circle className="panda-crumb panda-crumb-3" cx="78" cy="218" r="2" fill="#f97316" opacity="0" />
        </g>

        {/* Sweat drop for shadow_hiding / deep_drilling */}
        <g className="panda-particles panda-particles-sweat">
          <path className="panda-sweat panda-sweat-1" d="M 100 100 Q 97 107 100 110 Q 103 107 100 100 Z" fill="#60a5fa" opacity="0" />
        </g>

        {/* Water splash for deep_drilling */}
        <g className="panda-particles panda-particles-splash">
          <circle className="panda-splash panda-splash-1" cx="80" cy="305" r="0" fill="#3b82f6" opacity="0" />
          <circle className="panda-splash panda-splash-2" cx="100" cy="305" r="0" fill="#3b82f6" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

export const PandaCompanion = memo(PandaCompanionInner);
