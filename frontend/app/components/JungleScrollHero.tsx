import { useEffect, useRef } from "react";

const FRAME_COUNT = 240;
const FRAME_DIR = "/ezgif-2fb427b24ced9875-jpg";
const SMOOTHING = 0.12;
const SCROLL_HEIGHT_VH = 500;

function framePath(index: number) {
  return `${FRAME_DIR}/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;
}

function getScrollProgress() {
  const viewH = window.visualViewport?.height ?? window.innerHeight;
  const maxScroll = document.documentElement.scrollHeight - viewH;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function getViewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function shouldFitContain(viewW: number, viewH: number) {
  const isPortrait = viewH > viewW;
  const isTabletOrSmaller = viewW <= 1024;
  return isPortrait || isTabletOrSmaller;
}

function drawImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  viewW: number,
  viewH: number,
) {
  const imgRatio = img.width / img.height;
  const viewRatio = viewW / viewH;
  const useContain = shouldFitContain(viewW, viewH);

  let drawW: number;
  let drawH: number;
  let offsetX: number;
  let offsetY: number;

  if (useContain) {
    if (imgRatio > viewRatio) {
      drawW = viewW;
      drawH = drawW / imgRatio;
      offsetX = 0;
      offsetY = (viewH - drawH) / 2;
    } else {
      drawH = viewH;
      drawW = drawH * imgRatio;
      offsetX = (viewW - drawW) / 2;
      offsetY = 0;
    }
  } else if (imgRatio > viewRatio) {
    drawH = viewH;
    drawW = drawH * imgRatio;
    offsetX = (viewW - drawW) / 2;
    offsetY = 0;
  } else {
    drawW = viewW;
    drawH = drawW / imgRatio;
    offsetX = 0;
    offsetY = (viewH - drawH) / 2;
  }

  ctx.fillStyle = "#081c15";
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

export function JungleScrollHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const images = new Array<HTMLImageElement>(FRAME_COUNT);
    let loadedCount = 0;

    const drawFrame = (index: number) => {
      const frame = Math.min(Math.max(index, 0), FRAME_COUNT - 1);
      const img = images[frame];
      if (!img?.complete) return;

      const { width: viewW, height: viewH } = getViewportSize();
      ctx.clearRect(0, 0, viewW, viewH);
      drawImage(ctx, img, viewW, viewH);
    };

    const resizeCanvas = () => {
      const { width: viewW, height: viewH } = getViewportSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(Math.round(currentFrameRef.current));
    };

    const updateTargetFrame = () => {
      targetFrameRef.current = getScrollProgress() * (FRAME_COUNT - 1);
    };

    const tick = () => {
      const delta = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(delta) > 0.001) {
        currentFrameRef.current += delta * SMOOTHING;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      drawFrame(Math.round(currentFrameRef.current));
      rafRef.current = requestAnimationFrame(tick);
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      img.onload = () => {
        loadedCount += 1;
        if (loadedCount === 1) {
          resizeCanvas();
          drawFrame(0);
        }
      };
      images[i] = img;
    }

    const previousOverflow = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";

    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("scroll", updateTargetFrame, { passive: true });
    window.visualViewport?.addEventListener("resize", resizeCanvas, { passive: true });
    window.visualViewport?.addEventListener("scroll", resizeCanvas, { passive: true });

    resizeCanvas();
    updateTargetFrame();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.body.style.overflowX = previousOverflow;
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", updateTargetFrame);
      window.visualViewport?.removeEventListener("resize", resizeCanvas);
      window.visualViewport?.removeEventListener("scroll", resizeCanvas);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 min-h-[100dvh] overflow-hidden bg-[#081c15]" aria-hidden>
        <canvas ref={canvasRef} className="block h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[#0d2818]/10 backdrop-blur-[2px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0d2818]/35 via-white/5 to-[#081c15]/45" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15" />
        <div className="pointer-events-none absolute inset-0 border border-white/[0.06] shadow-[inset_0_0_80px_rgba(255,255,255,0.04)]" />
      </div>

      <div
        className="relative z-10"
        style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
        aria-hidden
      />
    </>
  );
}
