import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Compass, Leaf, TreePalm } from "lucide-react";
import {
  SvgBirdSilhouette,
  SvgDistantBirdFlock,
  SvgForestFloor,
  SvgLightShafts,
  SvgMistLayers,
  SvgNaturalCanopyShadow,
} from "./JungleWildlifeSvgs";

/** Rich walnut / oak grain for dark wooden surfaces */
export const darkWoodGrainStyle: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 36px 22px at 14% 38%, rgba(0,0,0,0.22) 0%, transparent 72%)",
    "radial-gradient(ellipse 28px 16px at 78% 62%, rgba(0,0,0,0.16) 0%, transparent 70%)",
    "radial-gradient(ellipse 20px 14px at 48% 18%, rgba(0,0,0,0.1) 0%, transparent 68%)",
    "radial-gradient(ellipse 24px 18px at 88% 28%, rgba(0,0,0,0.08) 0%, transparent 65%)",
    "repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 1px, transparent 1px 3px)",
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 54px)",
    "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 108px)",
    "linear-gradient(168deg, #A67B4A 0%, #8B5E3C 18%, #735032 38%, #5C3D2E 58%, #4A3024 78%, #3E2723 100%)",
  ].join(", "),
};

/** Light planed oak for inset panels and nav planks */
export const lightWoodGrainStyle: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 40px 12px at 30% 50%, rgba(139,94,60,0.12) 0%, transparent 70%)",
    "radial-gradient(ellipse 30px 10px at 70% 80%, rgba(139,94,60,0.08) 0%, transparent 68%)",
    "repeating-linear-gradient(0deg, rgba(139,94,60,0.09) 0 1px, transparent 1px 4px)",
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 28px)",
    "linear-gradient(180deg, #F2E2C4 0%, #E8D4B0 35%, #DFC9A0 70%, #D4BC92 100%)",
  ].join(", "),
};

export function WoodGrainOverlay({ className = "", variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={variant === "light" ? lightWoodGrainStyle : darkWoodGrainStyle}
    />
  );
}

/** Lush jungle backdrop behind wooden frame */
export function JungleBackdrop({ className = "" }: { className?: string }) {
  return (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-b from-[#0d2818] via-[#1b4332] to-[#081c15] ${className}`}
      />
      <div
        className="absolute inset-0 opacity-[0.22] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(82,183,136,0.45) 0%, transparent 42%), radial-gradient(circle at 85% 25%, rgba(255,183,3,0.12) 0%, transparent 35%), radial-gradient(circle at 50% 90%, rgba(45,106,79,0.5) 0%, transparent 50%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('/student-auth-jungle.avif')] bg-cover bg-center" />
    </>
  );
}

export function JungleLeafAccents() {
  return (
    <>
      <Leaf
        className="absolute -top-1 left-3 w-5 h-5 text-[#52b788]/70 pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
        strokeWidth={2}
      />
      <Leaf
        className="absolute top-8 -right-1 w-4 h-4 text-[#82c991]/50 pointer-events-none rotate-45"
        strokeWidth={2}
      />
      <TreePalm
        className="absolute bottom-16 -left-1 w-5 h-5 text-[#52b788]/40 pointer-events-none"
        strokeWidth={2}
      />
      <Compass
        className="absolute bottom-4 right-2 w-5 h-5 text-[#ffb703]/45 pointer-events-none"
        strokeWidth={2}
      />
    </>
  );
}

function WoodNail({ className }: { className: string }) {
  return (
    <div
      className={`absolute w-2.5 h-2.5 rounded-full z-[2] pointer-events-none ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 35%, #6D4C41 0%, #3E2723 55%, #1B120C 100%)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)",
      }}
    />
  );
}

function RopeHole({ className }: { className: string }) {
  return (
    <div
      className={`absolute w-3 h-3 rounded-full z-[3] pointer-events-none ${className}`}
      style={{
        background: "radial-gradient(circle at 40% 40%, #2E1F14 0%, #1B120C 70%)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 2px rgba(140,98,57,0.5)",
      }}
    />
  );
}

function RopeStrand({
  className,
  height = 48,
  lean = 0,
}: {
  className?: string;
  height?: number;
  lean?: number;
}) {
  return (
    <div
      className={`absolute w-[3px] rounded-full pointer-events-none z-20 ${className ?? ""}`}
      style={{
        height,
        transform: `rotate(${lean}deg)`,
        background:
          "repeating-linear-gradient(180deg, #B89B72 0 2px, #8B7355 2px 4px, #A89070 4px 6px)",
        boxShadow: "1px 0 2px rgba(0,0,0,0.35), -1px 0 1px rgba(255,255,255,0.08)",
      }}
    />
  );
}

export function HangingBoardStyles() {
  return (
    <style>{`
      @keyframes student-hanging-sway {
        0%, 100% { transform: rotate(-0.7deg); }
        50% { transform: rotate(0.7deg); }
      }
      .animate-student-hanging-sway {
        animation: student-hanging-sway 5.5s ease-in-out infinite;
        transform-origin: 50% 0%;
      }
    `}</style>
  );
}

/** Top branch + ropes suspending the main wooden board */
export function HangingWoodenBoard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col min-h-0 ${className}`}>
      <HangingBoardStyles />

      {/* Wooden branch rod */}
      <div className="relative h-8 mx-5 shrink-0 z-30">
        <div
          className="absolute left-0 right-0 top-4 h-3.5 rounded-full"
          style={{
            background: "linear-gradient(180deg, #7A5230 0%, #5D4037 55%, #3E2723 100%)",
            boxShadow: "0 3px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        />
        <RopeStrand className="left-[20%] top-5" height={52} lean={-3} />
        <RopeStrand className="right-[20%] top-5" height={52} lean={3} />
      </div>

      <div className="flex-1 min-h-0 -mt-1 animate-student-hanging-sway">
        <WoodenFrame hanging className="h-full min-h-[280px] lg:min-h-0">
          {children}
        </WoodenFrame>
      </div>
    </div>
  );
}

/** Thick wooden board frame with bevel, grain, and corner nails / rope holes */
export function WoodenFrame({
  children,
  className = "",
  hanging = false,
}: {
  children: ReactNode;
  className?: string;
  hanging?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col min-h-0 rounded-[14px] overflow-hidden ${className}`}
      style={{
        border: "6px solid #3E2723",
        boxShadow: hanging
          ? "0 18px 36px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(234,218,194,0.12), inset 0 2px 8px rgba(255,255,255,0.06)"
          : "0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(234,218,194,0.12), inset 0 2px 8px rgba(255,255,255,0.06)",
      }}
    >
      <WoodGrainOverlay />
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-[#EADAC2]/25 to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-y-0 right-0 w-[2px] bg-gradient-to-l from-[#1B120C]/40 to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-[#EADAC2]/20 to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-4 top-0 h-px bg-[#EADAC2]/10 pointer-events-none z-[1]" />
      {hanging ? (
        <>
          <RopeHole className="top-2 left-[18%]" />
          <RopeHole className="top-2 right-[18%]" />
        </>
      ) : (
        <>
          <WoodNail className="top-2.5 left-2.5" />
          <WoodNail className="top-2.5 right-2.5" />
        </>
      )}
      <WoodNail className="bottom-2.5 left-2.5" />
      <WoodNail className="bottom-2.5 right-2.5" />
      <div className="relative z-10 flex flex-col min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** Carved light-wood inset panel (profile card, etc.) */
export function LightWoodPanel({
  children,
  className = "",
  hanging = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  hanging?: boolean;
  style?: CSSProperties;
}) {
  const panel = (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        border: "3px solid #8C6239",
        boxShadow:
          "inset 0 3px 8px rgba(255,255,255,0.55), inset 0 -2px 6px rgba(109,76,65,0.15), 0 5px 14px rgba(62,39,35,0.28)",
        ...style,
      }}
    >
      <WoodGrainOverlay variant="light" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/40 pointer-events-none z-[1]" />
      <div className="relative z-10">{children}</div>
    </div>
  );

  if (!hanging) return panel;

  return (
    <div className="relative pt-4">
      <div
        className="absolute left-[16%] right-[16%] top-1 h-1 rounded-full pointer-events-none z-10"
        style={{ background: "linear-gradient(90deg, #5D4037, #8C6239, #5D4037)" }}
      />
      <RopeStrand className="left-[22%] top-1.5" height={14} lean={-4} />
      <RopeStrand className="right-[22%] top-1.5" height={14} lean={4} />
      {panel}
    </div>
  );
}

interface WoodNavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

/** Individual hanging wooden plank nav button */
export function WoodNavButton({ active, onClick, icon: Icon, label }: WoodNavButtonProps) {
  return (
    <div className="relative pt-3">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] h-2.5 rounded-full pointer-events-none z-10"
        style={{
          background: "repeating-linear-gradient(180deg, #B89B72 0 2px, #8B7355 2px 4px)",
          boxShadow: "0 1px 1px rgba(0,0,0,0.3)",
        }}
      />
      <button
        type="button"
        onClick={onClick}
        className={`relative w-full overflow-hidden rounded-md font-bold text-xs tracking-wide transition-all duration-200 group/btn ${
          active
            ? "border-[3px] border-[#C56A00] text-white shadow-[0_5px_0_#8B4513,0_8px_16px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.28)]"
            : "border-[3px] border-[#8C6239] text-[#3E2723] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_4px_0_#6D4C41,0_8px_14px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
        }`}
      >
        {active ? (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #FFB347 0%, #FF9F1C 45%, #E88F0A 100%)",
            }}
          />
        ) : (
          <WoodGrainOverlay variant="light" />
        )}
        <div className="relative z-10 flex items-center gap-3 px-3 py-2.5">
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover/btn:scale-110 ${
              active ? "text-white" : "text-[#8C6239]"
            }`}
            strokeWidth={2.5}
          />
          <span className="text-left flex-1">{label}</span>
        </div>
      </button>
    </div>
  );
}

/** Dark wood hanging sign-out plank */
export function WoodSignOutButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative pt-3">
      <RopeStrand className="left-1/2 -translate-x-1/2 top-0" height={12} lean={0} />
      <button
        type="button"
        onClick={onClick}
        className="relative w-full overflow-hidden rounded-md font-bold text-xs tracking-wide text-[#EADAC2] transition duration-200 cursor-pointer active:translate-y-0.5"
        style={{
          border: "3px solid #2E1F14",
          boxShadow: "0 5px 0 #1B120C, 0 8px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <WoodGrainOverlay />
        <div className="relative z-10 flex items-center justify-center gap-2 px-3 py-2.5 hover:brightness-110 transition">
          {children}
        </div>
      </button>
    </div>
  );
}

/** Keyframe animations for the lively jungle dashboard */
export function JungleDashboardStyles() {
  return (
    <style>{`
      @keyframes jungle-butterfly-1 {
        0%, 100% { transform: translate(0, 0) rotate(-5deg); }
        25% { transform: translate(30px, -20px) rotate(5deg); }
        50% { transform: translate(60px, 10px) rotate(-3deg); }
        75% { transform: translate(25px, 25px) rotate(8deg); }
      }
      @keyframes jungle-butterfly-2 {
        0%, 100% { transform: translate(0, 0) rotate(5deg); }
        33% { transform: translate(-40px, 15px) rotate(-8deg); }
        66% { transform: translate(-20px, -25px) rotate(6deg); }
      }
      @keyframes jungle-flap-left {
        0%, 100% { transform: scaleX(1) rotate(-12deg); }
        50% { transform: scaleX(0.7) rotate(-20deg); }
      }
      @keyframes jungle-flap-right {
        0%, 100% { transform: scaleX(-1) rotate(12deg); }
        50% { transform: scaleX(-0.7) rotate(20deg); }
      }
      @keyframes jungle-bird-fly {
        0% { transform: translateX(-8vw) translateY(0); opacity: 0; }
        12% { opacity: 0.35; }
        88% { opacity: 0.35; }
        100% { transform: translateX(108vw) translateY(-12px); opacity: 0; }
      }
      @keyframes jungle-bird-fly-reverse {
        0% { transform: translateX(108vw) scaleX(-1); opacity: 0; }
        12% { opacity: 0.3; }
        100% { transform: translateX(-8vw) scaleX(-1) translateY(-8px); opacity: 0; }
      }
      @keyframes jungle-mist-drift {
        0%, 100% { transform: translateX(0); opacity: 0.9; }
        50% { transform: translateX(20px); opacity: 1; }
      }
      @keyframes jungle-wing-silhouette {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(0.7); }
      }
      @keyframes jungle-wing-flap {
        0%, 100% { transform: rotate(0deg) scaleY(1); }
        50% { transform: rotate(-18deg) scaleY(0.75); }
      }
      @keyframes jungle-wing-up {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(-12deg); }
      }
      @keyframes jungle-monkey-swing {
        0%, 100% { transform: rotate(-4deg); }
        50% { transform: rotate(6deg); }
      }
      @keyframes jungle-trunk-sway {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(8deg); }
      }
      @keyframes jungle-bird-fly-slow {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(12px); }
      }
      @keyframes jungle-parrot-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes jungle-crawl {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(8px); }
      }
      @keyframes jungle-hop {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes jungle-wiggle {
        0%, 100% { transform: rotate(-6deg); }
        50% { transform: rotate(6deg); }
      }
      @keyframes jungle-firefly {
        0%, 100% { opacity: 0.08; transform: scale(0.9); }
        50% { opacity: 0.45; transform: scale(1); }
      }
      @keyframes jungle-leaf-sway {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(3deg); }
      }
      @keyframes jungle-sun-glow {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      .animate-jungle-butterfly-1 { animation: jungle-butterfly-1 14s ease-in-out infinite; }
      .animate-jungle-butterfly-2 { animation: jungle-butterfly-2 18s ease-in-out infinite; }
      .animate-jungle-flap-left { animation: jungle-flap-left 0.35s ease-in-out infinite; }
      .animate-jungle-flap-right { animation: jungle-flap-right 0.35s ease-in-out infinite; }
      .animate-jungle-bird-fly { animation: jungle-bird-fly 22s linear infinite; }
      .animate-jungle-bird-fly-reverse { animation: jungle-bird-fly-reverse 26s linear infinite; }
      .jungle-wing-flap { animation: jungle-wing-flap 0.4s ease-in-out infinite; }
      .jungle-wing-up { animation: jungle-wing-up 0.6s ease-in-out infinite; }
      .jungle-monkey-swing { animation: jungle-monkey-swing 3s ease-in-out infinite; }
      .jungle-trunk-sway { animation: jungle-trunk-sway 4s ease-in-out infinite; }
      .jungle-bird-fly-slow { animation: jungle-bird-fly-slow 5s ease-in-out infinite; }
      .jungle-parrot-bob { animation: jungle-parrot-bob 2.5s ease-in-out infinite; }
      .jungle-hop { animation: jungle-hop 2.5s ease-in-out infinite; }
      .jungle-crawl { animation: jungle-crawl 8s ease-in-out infinite; }
      .animate-jungle-hop { animation: jungle-hop 2.5s ease-in-out infinite; }
      .animate-jungle-wiggle { animation: jungle-wiggle 3s ease-in-out infinite; }
      .animate-jungle-firefly { animation: jungle-firefly 4s ease-in-out infinite; }
      .animate-jungle-leaf-sway { animation: jungle-leaf-sway 6s ease-in-out infinite; }
      .jungle-leaf-sway { animation: jungle-leaf-sway 8s ease-in-out infinite; transform-origin: center; }
      .jungle-mist-drift { animation: jungle-mist-drift 20s ease-in-out infinite; }
      .jungle-wing-silhouette { animation: jungle-wing-silhouette 1.2s ease-in-out infinite; transform-origin: center; }
      .animate-jungle-sun-glow { animation: jungle-sun-glow 8s ease-in-out infinite; }
    `}</style>
  );
}

function JungleButterfly({
  className = "",
  color = "#8B9A6B",
  delay = "0s",
  variant = 1,
}: {
  className?: string;
  color?: string;
  delay?: string;
  variant?: 1 | 2;
}) {
  return (
    <div
      className={`absolute w-5 h-5 pointer-events-none select-none z-[2] opacity-50 ${
        variant === 1 ? "animate-jungle-butterfly-1" : "animate-jungle-butterfly-2"
      } ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-2.5 h-4 animate-jungle-flap-left">
          <svg viewBox="0 0 50 80" className="w-full h-full">
            <path
              d="M50,40 C50,15 20,0 5,15 C-5,25 5,45 50,50 C20,55 10,65 15,75 C20,85 50,70 50,55"
              fill={color}
            />
          </svg>
        </div>
        <div className="w-px h-3 bg-[#3E4A38] rounded-full z-10" />
        <div className="w-2.5 h-4 animate-jungle-flap-right">
          <svg viewBox="0 0 50 80" className="w-full h-full">
            <path
              d="M50,40 C50,15 20,0 5,15 C-5,25 5,45 50,50 C20,55 10,65 15,75 C20,85 50,70 50,55"
              fill={color}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Natural rainforest clearing — photo base, mist, soft light & silhouettes */
export function JungleMainScene() {
  const fireflies = [
    { left: "18%", top: "42%", delay: "0s" },
    { left: "72%", top: "38%", delay: "2.5s" },
    { left: "48%", top: "58%", delay: "1.2s" },
    { left: "85%", top: "52%", delay: "3.8s" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <JungleDashboardStyles />

      {/* Deep forest base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #0f1f16 0%, #152a20 25%, #1a3328 55%, #1e3d30 100%)",
        }}
      />

      {/* Real jungle photography */}
      <div
        className="absolute inset-0 bg-[url('/student-auth-jungle.avif')] bg-cover bg-center"
        style={{ opacity: 0.62 }}
      />
      <div
        className="absolute inset-0 bg-[url('/student-auth-bg-desktop.png')] bg-cover bg-center mix-blend-soft-light hidden lg:block"
        style={{ opacity: 0.18 }}
      />

      {/* Atmospheric depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(45,90,70,0.15) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(8,20,14,0.5) 0%, transparent 55%)",
        }}
      />

      <SvgNaturalCanopyShadow />
      <SvgLightShafts />
      <SvgMistLayers />
      <SvgForestFloor />

      {/* Distant birds on horizon */}
      <div className="absolute top-[8%] left-0 right-0 z-[2]">
        <SvgDistantBirdFlock className="w-full h-8 opacity-80" />
      </div>

      {/* Occasional flying silhouettes */}
      <div
        className="absolute top-[14%] left-0 animate-jungle-bird-fly z-[2]"
        style={{ animationDelay: "0s", animationDuration: "38s" }}
      >
        <SvgBirdSilhouette size={1.1} />
      </div>
      <div
        className="absolute top-[20%] left-0 animate-jungle-bird-fly z-[2]"
        style={{ animationDelay: "14s", animationDuration: "42s" }}
      >
        <SvgBirdSilhouette size={0.85} />
      </div>
      <div
        className="absolute top-[11%] right-0 animate-jungle-bird-fly-reverse z-[2]"
        style={{ animationDelay: "22s", animationDuration: "45s" }}
      >
        <SvgBirdSilhouette size={0.9} />
      </div>

      {/* Subtle natural butterflies */}
      <JungleButterfly className="top-[30%] left-[20%] z-[2]" color="#9CAF88" />
      <JungleButterfly className="top-[45%] right-[25%] z-[2]" color="#B8A88A" delay="3s" variant={2} />

      {/* Soft fireflies in the undergrowth */}
      {fireflies.map((f, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#E8D5A3] rounded-full animate-jungle-firefly z-[2]"
          style={{
            left: f.left,
            top: f.top,
            animationDelay: f.delay,
            boxShadow: "0 0 4px rgba(232, 213, 163, 0.5)",
          }}
        />
      ))}

      {/* Edge vignette for depth */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          boxShadow: "inset 0 0 120px rgba(8,18,12,0.45), inset 0 80px 60px rgba(10,22,16,0.35)",
        }}
      />
    </div>
  );
}

/** Welcome banner — natural forest photo with soft light */
export function JungleHeroBanner({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl"
      style={{
        border: "3px solid #3E2723",
        boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
      }}
    >
      {/* Natural jungle photo background */}
      <div
        className="absolute inset-0 bg-[url('/student-auth-jungle.avif')] bg-cover bg-center"
        style={{ opacity: 0.75 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(10,24,18,0.88) 0%, rgba(15,35,26,0.72) 45%, rgba(20,45,34,0.55) 100%)",
        }}
      />
      <SvgLightShafts className="opacity-60" />
      <SvgNaturalCanopyShadow className="opacity-90" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative shrink-0">
          <img
            src="/favicon.png"
            alt=""
            className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
          />
        </div>
        <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#7a9e7e]" strokeWidth={2} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a8c4a8]">
              Deep in the Jungle
            </span>
          </div>
          <h2 className="font-sans text-2xl md:text-3xl font-black tracking-tight text-[#f5f0e6] drop-shadow-sm">
            Welcome, {name}
          </h2>
          <p className="text-xs font-medium text-[#c8d9c8] max-w-lg leading-relaxed">{subtitle}</p>
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 opacity-50">
            <SvgBirdSilhouette size={0.9} />
            <TreePalm className="w-4 h-4 text-[#6b8f71]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Wooden stat plaque for dashboard counters */
export function JungleStatPlaque({
  label,
  value,
  icon: Icon,
  accent = "#4a6b52",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <LightWoodPanel className="p-4 flex flex-col justify-between min-h-[5.5rem]" style={{ backgroundColor: "rgba(242,226,196,0.94)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#6D4C41]">{label}</span>
        <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2.5} />
      </div>
      <span className="text-2xl font-black text-[#3E2723] mt-2">{value}</span>
    </LightWoodPanel>
  );
}

/** Hanging trail sign — quick-nav button */
export function JungleTrailSign({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="relative pt-3">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] h-2 rounded-full pointer-events-none"
        style={{
          background: "repeating-linear-gradient(180deg, #B89B72 0 2px, #8B7355 2px 4px)",
        }}
      />
      <button
        type="button"
        onClick={onClick}
        className="relative w-full overflow-hidden rounded-lg text-left transition-all duration-200 hover:-translate-y-0.5 group/sign"
        style={{
          border: "3px solid #8C6239",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 0 #6D4C41, 0 8px 14px rgba(0,0,0,0.15)",
        }}
      >
        <WoodGrainOverlay variant="light" />
        <div className="relative z-10 flex items-center gap-3 px-4 py-3">
          <Icon
            className="w-5 h-5 shrink-0 text-[#8C6239] group-hover/sign:scale-110 transition-transform"
            strokeWidth={2.5}
          />
          <p className="font-black text-xs text-[#3E2723]">{label}</p>
        </div>
      </button>
    </div>
  );
}

/** Section heading for dashboard tabs */
export function JungleSectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{
          border: "2px solid #8C6239",
          background: "linear-gradient(180deg, #F2E2C4 0%, #DFC9A0 100%)",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)",
        }}
      >
        <Icon className="w-5 h-5 text-[#8C6239]" strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="font-sans text-lg font-black text-[#1b4332]">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-[#2d6a4f] font-semibold mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Light wood content panel — slightly translucent for natural depth */
export function JungleContentPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <LightWoodPanel className={`p-5 relative ${className}`} style={{ backgroundColor: "rgba(242,226,196,0.92)" }}>
      {children}
    </LightWoodPanel>
  );
}

export const studentMainCanvasClass =
  "flex-1 overflow-y-auto p-4 md:p-6 focus:outline-none relative";
