import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  BadgeJapaneseYen,
  Check,
  Download,
  FileArchive,
  ImagePlus,
  Layers,
  Lock,
  MonitorSmartphone,
  Palette,
  Settings,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";

type Platform = "ios" | "android";
type FrameStyle = "device" | "card" | "full";
type TextLayout = "top" | "split" | "minimal";

type DevicePreset = {
  id: string;
  platform: Platform;
  label: string;
  size: string;
  width: number;
  height: number;
  note: string;
};

type PaletteOption = {
  id: string;
  name: string;
  colors: [string, string, string];
  ink: string;
  softInk: string;
};

type AppState = {
  appName: string;
  headline: string;
  subhead: string;
  badge: string;
  presetId: string;
  paletteId: string;
  frameStyle: FrameStyle;
  textLayout: TextLayout;
  imageUrl: string;
  imageName: string;
};

const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: "ios-69-1320",
    platform: "ios",
    label: "iPhone 6.9 inch",
    size: "1320 x 2868",
    width: 1320,
    height: 2868,
    note: "App Store向けの大型iPhone縦長サイズ",
  },
  {
    id: "ios-69-1290",
    platform: "ios",
    label: "iPhone 6.9 inch",
    size: "1290 x 2796",
    width: 1290,
    height: 2796,
    note: "App Store Connectで使いやすい標準サイズ",
  },
  {
    id: "ios-65",
    platform: "ios",
    label: "iPhone 6.5 inch",
    size: "1284 x 2778",
    width: 1284,
    height: 2778,
    note: "6.9 inchを用意しない場合の補助サイズ",
  },
  {
    id: "android-phone",
    platform: "android",
    label: "Google Play phone",
    size: "1080 x 1920",
    width: 1080,
    height: 1920,
    note: "Playストアのスマートフォン掲載向け",
  },
  {
    id: "android-large",
    platform: "android",
    label: "Google Play large",
    size: "1440 x 2560",
    width: 1440,
    height: 2560,
    note: "高解像度のAndroid素材向け",
  },
];

const PALETTES: PaletteOption[] = [
  {
    id: "paper",
    name: "Paper",
    colors: ["#fbf6ea", "#e6f0ff", "#d5eadf"],
    ink: "#222426",
    softInk: "#5c635f",
  },
  {
    id: "mint",
    name: "Mint",
    colors: ["#e9fbf2", "#bfe8d0", "#fff6d8"],
    ink: "#1f352b",
    softInk: "#51675d",
  },
  {
    id: "coral",
    name: "Coral",
    colors: ["#fff0ea", "#ffd0c2", "#d7ecff"],
    ink: "#332522",
    softInk: "#6d5751",
  },
  {
    id: "mono",
    name: "Mono",
    colors: ["#f7f7f5", "#dfe3e6", "#ffffff"],
    ink: "#18191a",
    softInk: "#5e6266",
  },
];

const DEFAULT_STATE: AppState = {
  appName: "Your App",
  headline: "毎日の作業を、もっと短く。",
  subhead: "3タップで整理。通知も履歴もひとつにまとまります。",
  badge: "新機能",
  presetId: "ios-69-1290",
  paletteId: "paper",
  frameStyle: "device",
  textLayout: "top",
  imageUrl: "",
  imageName: "",
};

const PAYMENT_LINK = import.meta.env.VITE_PAYMENT_LINK || "";
const SERVICE_LINK = import.meta.env.VITE_SERVICE_LINK || "";
const PRO_CODE = "STORESHOT-LAUNCH";
const REPO_ISSUES_URL = "https://github.com/matsumaru-t/storeshot-jp/issues/new";
const FALLBACK_PAYMENT_LINK = buildIssueUrl("pro-order.yml", "Pro版の購入希望");
const FALLBACK_SERVICE_LINK = buildIssueUrl("service-order.yml", "ストア画像制作代行の依頼");

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [isPro, setIsPro] = useState(() => localStorage.getItem("storeshot:pro") === "true");
  const [licenseInput, setLicenseInput] = useState("");
  const [showRevenuePanel, setShowRevenuePanel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("スクリーンショットをアップロードして編集できます。");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const preset = useMemo(
    () => DEVICE_PRESETS.find((item) => item.id === state.presetId) ?? DEVICE_PRESETS[0],
    [state.presetId],
  );
  const palette = useMemo(
    () => PALETTES.find((item) => item.id === state.paletteId) ?? PALETTES[0],
    [state.paletteId],
  );
  const paymentHref = PAYMENT_LINK || FALLBACK_PAYMENT_LINK;
  const serviceHref = SERVICE_LINK || FALLBACK_SERVICE_LINK;

  const update = <Key extends keyof AppState>(key: Key, value: AppState[Key]) => {
    setState((current) => {
      const next = { ...current, [key]: value };
      saveState(next);
      return next;
    });
  };

  const drawCurrent = useCallback(() => {
    if (!canvasRef.current) return;
    drawArtwork(canvasRef.current, {
      state,
      preset,
      palette,
      image: imageRef.current,
      watermark: !isPro,
    });
  }, [isPro, palette, preset, state]);

  useEffect(() => {
    if (!state.imageUrl) {
      imageRef.current = null;
      drawCurrent();
      return;
    }

    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      drawCurrent();
    };
    image.src = state.imageUrl;
  }, [drawCurrent, state.imageUrl]);

  useEffect(() => {
    drawCurrent();
  }, [drawCurrent]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("画像ファイルを選択してください。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result);
      setState((current) => {
        const next = { ...current, imageUrl, imageName: file.name };
        saveState(next);
        return next;
      });
      setStatus(`${file.name} を読み込みました。`);
    };
    reader.readAsDataURL(file);
  };

  const exportPng = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    const fileName = buildFileName(state.appName, preset);
    await downloadCanvas(canvasRef.current, fileName);
    setExporting(false);
    setStatus(`${fileName} を書き出しました。`);
  };

  const exportPack = async () => {
    if (!isPro) {
      setShowRevenuePanel(true);
      setStatus("一括ZIP書き出しはPro機能です。");
      return;
    }

    setExporting(true);
    const zip = new JSZip();
    for (const item of DEVICE_PRESETS) {
      const scratch = document.createElement("canvas");
      drawArtwork(scratch, {
        state,
        preset: item,
        palette,
        image: imageRef.current,
        watermark: false,
      });
      const blob = await canvasToBlob(scratch);
      zip.file(buildFileName(state.appName, item), blob);
    }
    const archive = await zip.generateAsync({ type: "blob" });
    downloadBlob(archive, `${slugify(state.appName)}-store-screenshots.zip`);
    setExporting(false);
    setStatus("全サイズのZIPを書き出しました。");
  };

  const unlockPro = () => {
    if (licenseInput.trim() !== PRO_CODE) {
      setStatus("ライセンスコードが違います。");
      return;
    }
    setIsPro(true);
    localStorage.setItem("storeshot:pro", "true");
    setShowRevenuePanel(false);
    setStatus("Pro機能を有効化しました。");
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="sidebar" aria-label="編集パネル">
          <div className="brand">
            <div className="brand-mark">
              <MonitorSmartphone size={24} aria-hidden />
            </div>
            <div>
              <p className="eyebrow">StoreShot JP</p>
              <h1>ストア画像メーカー</h1>
            </div>
          </div>

          <div className="panel">
            <PanelTitle icon={<Upload size={18} />} title="素材" />
            <label className="upload-box">
              <ImagePlus size={22} aria-hidden />
              <span>{state.imageName || "アプリ画面をアップロード"}</span>
              <input accept="image/*" type="file" onChange={handleImageUpload} />
            </label>
          </div>

          <div className="panel">
            <PanelTitle icon={<Type size={18} />} title="コピー" />
            <Field
              label="アプリ名"
              value={state.appName}
              maxLength={30}
              onChange={(value) => update("appName", value)}
            />
            <Field
              label="見出し"
              value={state.headline}
              maxLength={42}
              onChange={(value) => update("headline", value)}
            />
            <Field
              label="説明"
              value={state.subhead}
              maxLength={78}
              onChange={(value) => update("subhead", value)}
            />
            <Field
              label="ラベル"
              value={state.badge}
              maxLength={12}
              onChange={(value) => update("badge", value)}
            />
          </div>

          <div className="panel">
            <PanelTitle icon={<Settings size={18} />} title="サイズ" />
            <div className="preset-list" role="list">
              {DEVICE_PRESETS.map((item) => (
                <button
                  className={item.id === state.presetId ? "preset active" : "preset"}
                  key={item.id}
                  onClick={() => update("presetId", item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <small>{item.size}</small>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="stage" aria-label="プレビュー">
          <div className="topbar">
            <div className="segmented" aria-label="レイアウト">
              {[
                ["top", "上部コピー"],
                ["split", "分割"],
                ["minimal", "最小"],
              ].map(([id, label]) => (
                <button
                  className={state.textLayout === id ? "active" : ""}
                  key={id}
                  onClick={() => update("textLayout", id as TextLayout)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="actions">
              <button className="icon-button" onClick={exportPng} title="PNGを書き出す" type="button">
                <Download size={18} />
                <span>PNG</span>
              </button>
              <button className="icon-button primary" onClick={exportPack} title="ZIPで一括書き出し" type="button">
                {isPro ? <FileArchive size={18} /> : <Lock size={18} />}
                <span>ZIP</span>
              </button>
            </div>
          </div>

          <div className="canvas-wrap">
            <canvas ref={canvasRef} aria-label="書き出しプレビュー" />
          </div>

          <div className="statusbar">
            <div>
              <strong>{preset.label}</strong>
              <span>{preset.size}</span>
            </div>
            <p>{exporting ? "書き出し中..." : status}</p>
          </div>
        </section>

        <aside className="inspector" aria-label="設定パネル">
          <div className="panel">
            <PanelTitle icon={<Palette size={18} />} title="色" />
            <div className="palette-grid">
              {PALETTES.map((item) => (
                <button
                  className={item.id === state.paletteId ? "palette active" : "palette"}
                  key={item.id}
                  onClick={() => update("paletteId", item.id)}
                  type="button"
                >
                  <span style={{ background: item.colors[0] }} />
                  <span style={{ background: item.colors[1] }} />
                  <span style={{ background: item.colors[2] }} />
                  <small>{item.name}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <PanelTitle icon={<Layers size={18} />} title="フレーム" />
            <div className="choice-grid">
              {[
                ["device", "端末"],
                ["card", "カード"],
                ["full", "全面"],
              ].map(([id, label]) => (
                <button
                  className={state.frameStyle === id ? "choice active" : "choice"}
                  key={id}
                  onClick={() => update("frameStyle", id as FrameStyle)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel revenue">
            <PanelTitle icon={<BadgeJapaneseYen size={18} />} title="収益導線" />
            <div className="price-line">
              <span>Pro書き出し</span>
              <strong>¥980</strong>
            </div>
            <div className="price-line">
              <span>制作代行</span>
              <strong>¥9,800</strong>
            </div>
            <button className="wide-button" onClick={() => setShowRevenuePanel(true)} type="button">
              <Sparkles size={18} />
              Pro導線を確認
            </button>
          </div>

          <div className="panel checklist">
            <PanelTitle icon={<Check size={18} />} title="公開チェック" />
            <ul>
              <li>Apple: 1〜10枚のPNG/JPEGを用意</li>
              <li>Google Play: 最低2枚、320〜3840px</li>
              <li>無料版は透かし入りでSNS拡散</li>
              <li>Pro/代行リンクを公開前に設定</li>
            </ul>
          </div>
        </aside>
      </section>

      {showRevenuePanel && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Pro機能">
            <button
              aria-label="閉じる"
              className="close"
              onClick={() => setShowRevenuePanel(false)}
              title="閉じる"
              type="button"
            >
              <X size={17} />
            </button>
            <p className="eyebrow">Monetize</p>
            <h2>無料ユーザーを有料導線へ送る</h2>
            <p>
              無料版はPNG単体書き出し、Proは透かしなしZIP一括書き出し。制作代行は1件で月1万円近くを狙う商品です。
            </p>
            <div className="modal-actions">
              <a className="button-link primary" href={paymentHref} rel="noreferrer" target="_blank">
                Proを購入
              </a>
              <a className="button-link" href={serviceHref} rel="noreferrer" target="_blank">
                制作代行を依頼
              </a>
            </div>
            <div className="license-row">
              <input
                aria-label="ライセンスコード"
                onChange={(event) => setLicenseInput(event.target.value)}
                placeholder="ライセンスコード"
                value={licenseInput}
              />
              <button onClick={unlockPro} type="button">
                有効化
              </button>
            </div>
            {!PAYMENT_LINK && (
              <p className="setup-note">
                現在はGitHub Issueで購入希望を受け付けます。Stripe決済リンクを設定すると直接決済に切り替わります。
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function Field({
  label,
  maxLength,
  onChange,
  value,
}: {
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        <small>
          {value.length}/{maxLength}
        </small>
      </span>
      <input maxLength={maxLength} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function loadState(): AppState {
  const stored = localStorage.getItem("storeshot:state");
  if (!stored) return DEFAULT_STATE;
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: AppState) {
  localStorage.setItem("storeshot:state", JSON.stringify(state));
}

function buildIssueUrl(template: string, title: string) {
  return `${REPO_ISSUES_URL}?template=${template}&title=${encodeURIComponent(title)}`;
}

function drawArtwork(
  canvas: HTMLCanvasElement,
  options: {
    state: AppState;
    preset: DevicePreset;
    palette: PaletteOption;
    image: HTMLImageElement | null;
    watermark: boolean;
  },
) {
  const { state, preset, palette, image, watermark } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = preset.width;
  canvas.height = preset.height;
  const width = preset.width;
  const height = preset.height;
  const unit = width / 100;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette.colors[0]);
  gradient.addColorStop(0.56, palette.colors[1]);
  gradient.addColorStop(1, palette.colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawBackdropShape(ctx, width, height, palette.colors[2]);

  if (state.textLayout !== "minimal") {
    const isSplit = state.textLayout === "split";
    const left = isSplit ? unit * 8 : unit * 10;
    const maxTextWidth = isSplit ? width * 0.4 : width * 0.8;
    const top = isSplit ? height * 0.18 : height * 0.085;

    drawBadge(ctx, state.badge, left, top, palette.ink, width);
    drawWrappedText(ctx, state.headline, {
      x: left,
      y: top + unit * 9,
      maxWidth: maxTextWidth,
      lineHeight: unit * 7.6,
      font: `800 ${unit * 6.8}px -apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif`,
      color: palette.ink,
      maxLines: 3,
    });
    drawWrappedText(ctx, state.subhead, {
      x: left,
      y: top + unit * 32,
      maxWidth: maxTextWidth,
      lineHeight: unit * 4.4,
      font: `500 ${unit * 3.4}px -apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif`,
      color: palette.softInk,
      maxLines: 3,
    });
  }

  const frame = getFrameRect(width, height, state.textLayout, state.frameStyle);
  if (state.frameStyle === "full") {
    if (image) {
      drawImageCover(ctx, image, frame.x, frame.y, frame.w, frame.h, 0);
    } else {
      drawPlaceholder(ctx, frame, palette);
    }
  } else {
    drawFrame(ctx, frame, state.frameStyle, palette);
    if (image) {
      const pad = state.frameStyle === "device" ? Math.max(18, width * 0.028) : Math.max(10, width * 0.012);
      drawImageCover(ctx, image, frame.x + pad, frame.y + pad, frame.w - pad * 2, frame.h - pad * 2, width * 0.055);
    } else {
      drawPlaceholder(ctx, {
        x: frame.x + width * 0.04,
        y: frame.y + width * 0.04,
        w: frame.w - width * 0.08,
        h: frame.h - width * 0.08,
      }, palette);
    }
  }

  drawAppName(ctx, state.appName, width, height, palette);

  if (watermark) {
    ctx.save();
    ctx.fillStyle = "rgba(24, 25, 26, 0.46)";
    ctx.font = `700 ${Math.max(26, width * 0.028)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Made with StoreShot JP", width / 2, height - width * 0.07);
    ctx.restore();
  }
}

function drawBackdropShape(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(width * 0.9, height * 0.16, width * 0.25, height * 0.14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.38;
  ctx.beginPath();
  ctx.roundRect(width * -0.08, height * 0.72, width * 0.48, height * 0.18, width * 0.08);
  ctx.fill();
  ctx.restore();
}

function drawBadge(ctx: CanvasRenderingContext2D, badge: string, x: number, y: number, color: string, width: number) {
  if (!badge.trim()) return;
  ctx.save();
  const fontSize = Math.max(22, width * 0.028);
  ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif`;
  const textWidth = ctx.measureText(badge).width;
  const padX = fontSize * 0.75;
  const h = fontSize * 1.7;
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.beginPath();
  ctx.roundRect(x, y, textWidth + padX * 2, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(badge, x + padX, y + h / 2 + fontSize * 0.04);
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    font: string;
    color: string;
    maxLines: number;
  },
) {
  ctx.save();
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, text, options.maxWidth, options.maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, options.x, options.y + index * options.lineHeight);
  });
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const source = text.trim();
  if (!source) return [];
  const tokens = source.includes(" ") ? source.split(/\s+/) : Array.from(source);
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const separator = source.includes(" ") && current ? " " : "";
    const next = `${current}${separator}${token}`;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = token;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  return lines.map((line, index) => {
    if (index !== maxLines - 1 || ctx.measureText(line).width <= maxWidth) return line;
    let shortened = line;
    while (shortened.length > 1 && ctx.measureText(`${shortened}...`).width > maxWidth) {
      shortened = shortened.slice(0, -1);
    }
    return `${shortened}...`;
  });
}

function getFrameRect(width: number, height: number, layout: TextLayout, frameStyle: FrameStyle) {
  if (frameStyle === "full") {
    return { x: width * 0.08, y: height * 0.28, w: width * 0.84, h: height * 0.58 };
  }
  if (layout === "split") {
    return { x: width * 0.52, y: height * 0.13, w: width * 0.39, h: height * 0.74 };
  }
  if (layout === "minimal") {
    return { x: width * 0.13, y: height * 0.11, w: width * 0.74, h: height * 0.76 };
  }
  return { x: width * 0.18, y: height * 0.36, w: width * 0.64, h: height * 0.5 };
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: { x: number; y: number; w: number; h: number },
  style: FrameStyle,
  palette: PaletteOption,
) {
  ctx.save();
  ctx.shadowColor = "rgba(29, 34, 38, 0.24)";
  ctx.shadowBlur = frame.w * 0.08;
  ctx.shadowOffsetY = frame.w * 0.04;
  ctx.fillStyle = style === "device" ? "#16181a" : "rgba(255, 255, 255, 0.88)";
  const radius = style === "device" ? frame.w * 0.1 : frame.w * 0.035;
  ctx.beginPath();
  ctx.roundRect(frame.x, frame.y, frame.w, frame.h, radius);
  ctx.fill();
  ctx.shadowColor = "transparent";
  if (style === "device") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.beginPath();
    ctx.roundRect(frame.x + frame.w * 0.35, frame.y + frame.w * 0.035, frame.w * 0.3, frame.w * 0.025, frame.w * 0.015);
    ctx.fill();
  } else {
    ctx.strokeStyle = palette.colors[1];
    ctx.lineWidth = Math.max(3, frame.w * 0.006);
    ctx.stroke();
  }
  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  frame: { x: number; y: number; w: number; h: number },
  palette: PaletteOption,
) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.66)";
  ctx.beginPath();
  ctx.roundRect(frame.x, frame.y, frame.w, frame.h, frame.w * 0.08);
  ctx.fill();
  ctx.fillStyle = palette.softInk;
  ctx.textAlign = "center";
  ctx.font = `700 ${Math.max(28, frame.w * 0.07)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText("Upload", frame.x + frame.w / 2, frame.y + frame.h / 2 - frame.w * 0.03);
  ctx.font = `500 ${Math.max(20, frame.w * 0.035)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText("app screenshot", frame.x + frame.w / 2, frame.y + frame.h / 2 + frame.w * 0.05);
  ctx.restore();
}

function drawAppName(
  ctx: CanvasRenderingContext2D,
  appName: string,
  width: number,
  height: number,
  palette: PaletteOption,
) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.66)";
  ctx.beginPath();
  ctx.roundRect(width * 0.08, height - width * 0.15, width * 0.84, width * 0.075, width * 0.026);
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.font = `800 ${Math.max(28, width * 0.032)}px -apple-system, BlinkMacSystemFont, "Noto Sans JP", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(appName || "Your App", width * 0.12, height - width * 0.112);
  ctx.fillStyle = palette.softInk;
  ctx.font = `600 ${Math.max(22, width * 0.024)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Store ready", width * 0.88, height - width * 0.112);
  ctx.restore();
}

async function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, fileName);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildFileName(appName: string, preset: DevicePreset) {
  return `${slugify(appName)}-${preset.id}-${preset.width}x${preset.height}.png`;
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "app"
  );
}

export default App;
