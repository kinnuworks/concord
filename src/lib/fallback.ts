import type { TileSpec } from "./tiles";

// Plain pictograms drawn by code. A card falls back to these when the image model
// cannot produce a tile that passes the read-back, so every tile on screen is either
// checked or drawn from the numbers themselves.

const INK = "#111";
const frame = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#fff"/>${inner}</svg>`;

function sun(cx: number, cy: number, r: number) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * (r + 18);
    const y1 = cy + Math.sin(a) * (r + 18);
    const x2 = cx + Math.cos(a) * (r + 52);
    const y2 = cy + Math.sin(a) * (r + 52);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>`;
  }).join("");
  return `${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f5b700" stroke="${INK}" stroke-width="14"/>`;
}

const horizon = `<rect x="0" y="330" width="512" height="182" fill="#fff"/><line x1="40" y1="330" x2="472" y2="330" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>`;

function timeTile(time: string) {
  if (time === "night") {
    return frame(
      `<rect width="512" height="512" fill="#1d2a52"/><path d="M300 110a150 150 0 1 0 90 270a120 120 0 1 1 -90 -270z" fill="#f7e9a0" stroke="${INK}" stroke-width="12"/><circle cx="120" cy="130" r="10" fill="#fff"/><circle cx="170" cy="330" r="8" fill="#fff"/><circle cx="410" cy="120" r="9" fill="#fff"/>`,
    );
  }
  if (time === "afternoon") return frame(sun(256, 256, 96));
  // Morning and evening both sit on the horizon; an arrow shows which way the sun moves.
  const up = time === "morning";
  const arrow = up
    ? `<path d="M256 110v-70m-34 34l34 -34l34 34" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M256 40v70m-34 -34l34 34l34 -34" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`;
  return frame(`${sun(256, 330, 90)}${horizon}${arrow}`);
}

function doseTile(form: string, count: number) {
  const cols = Math.min(count, 3);
  const rows = Math.ceil(count / 3);
  const gap = 150;
  const x0 = 256 - ((cols - 1) * gap) / 2;
  const y0 = 256 - ((rows - 1) * gap) / 2;
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = x0 + (i % 3) * gap;
    const y = y0 + Math.floor(i / 3) * gap;
    if (form === "capsule") {
      out += `<g transform="rotate(-30 ${x} ${y})"><rect x="${x - 58}" y="${y - 26}" width="116" height="52" rx="26" fill="#e0483e" stroke="${INK}" stroke-width="10"/><path d="M${x} ${y - 26}h32a26 26 0 0 1 0 52h-32z" fill="#fff" stroke="${INK}" stroke-width="10"/></g>`;
    } else if (form === "drops") {
      out += `<path d="M${x} ${y - 52}c34 44 44 62 44 78a44 44 0 0 1 -88 0c0 -16 10 -34 44 -78z" fill="#4aa3e8" stroke="${INK}" stroke-width="10"/>`;
    } else if (form === "spoon") {
      out += `<ellipse cx="${x - 22}" cy="${y}" rx="40" ry="28" fill="#c9792f" stroke="${INK}" stroke-width="10"/><line x1="${x + 18}" y1="${y}" x2="${x + 62}" y2="${y}" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>`;
    } else if (form === "puff") {
      out += `<circle cx="${x - 16}" cy="${y}" r="26" fill="#cfe4f5" stroke="${INK}" stroke-width="10"/><circle cx="${x + 20}" cy="${y - 10}" r="22" fill="#cfe4f5" stroke="${INK}" stroke-width="10"/>`;
    } else {
      out += `<circle cx="${x}" cy="${y}" r="50" fill="#fff" stroke="${INK}" stroke-width="12"/><line x1="${x - 34}" y1="${y}" x2="${x + 34}" y2="${y}" stroke="${INK}" stroke-width="8"/>`;
    }
  }
  return frame(out);
}

const mealTile = () =>
  frame(
    `<circle cx="256" cy="270" r="150" fill="#fff" stroke="${INK}" stroke-width="14"/><circle cx="256" cy="270" r="96" fill="#f3d9a4" stroke="${INK}" stroke-width="10"/><line x1="70" y1="150" x2="70" y2="400" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M50 150v70a20 20 0 0 0 40 0v-70" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><line x1="442" y1="240" x2="442" y2="400" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><ellipse cx="442" cy="190" rx="26" ry="50" fill="#fff" stroke="${INK}" stroke-width="12"/>`,
  );

// Avoid and warning tiles have no code-drawn picture. They show a neutral marker and
// the card prints the words beside it.
const markerTile = (symbol: "!" | "?") =>
  frame(
    `<circle cx="256" cy="256" r="170" fill="#fff" stroke="${INK}" stroke-width="16"/><text x="256" y="330" font-family="Arial, sans-serif" font-size="230" font-weight="700" text-anchor="middle" fill="${INK}">${symbol}</text>`,
  );

type Pt = [number, number];
const seg = (a: Pt, b: Pt, w = 22) =>
  `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`;
const polar = (o: Pt, len: number, deg: number): Pt => [
  o[0] + len * Math.cos((deg * Math.PI) / 180),
  o[1] - len * Math.sin((deg * Math.PI) / 180),
];

// Stick figure with the moving joint drawn at exactly the prescribed angle.
function exerciseTile(movement: string, angle: number) {
  const hi = "#e0483e";
  let body = "";
  if (movement === "knee_bend" || movement === "straight_leg_raise") {
    const hip: Pt = [250, 380];
    const shoulder: Pt = [110, 380];
    body += `<circle cx="70" cy="380" r="30" fill="#fff" stroke="${INK}" stroke-width="14"/>`;
    body += seg(shoulder, hip) + seg(hip, [450, 380]);
    if (movement === "straight_leg_raise") {
      const foot = polar(hip, 200, angle);
      body += `<line x1="${hip[0]}" y1="${hip[1]}" x2="${foot[0]}" y2="${foot[1]}" stroke="${hi}" stroke-width="22" stroke-linecap="round"/>`;
    } else {
      // The knee sits above the floor; thigh and shin meet at the prescribed angle.
      const half = (angle / 2) * (Math.PI / 180);
      const knee: Pt = [hip[0] + 120 * Math.sin(half), hip[1] - 120 * Math.cos(half)];
      const foot: Pt = [knee[0] + 120 * Math.sin(half), hip[1]];
      body += `<polyline points="${hip.join(",")} ${knee.join(",")} ${foot.join(",")}" fill="none" stroke="${hi}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    body += `<line x1="30" y1="408" x2="482" y2="408" stroke="${INK}" stroke-width="8"/>`;
  } else {
    const shoulder: Pt = [256, 170];
    const hip: Pt = [256, 320];
    body += `<circle cx="256" cy="110" r="34" fill="#fff" stroke="${INK}" stroke-width="14"/>`;
    body += seg(shoulder, hip) + seg(hip, [216, 470]) + seg(hip, [296, 470]);
    if (movement === "elbow_bend") {
      const elbow: Pt = [256, 270];
      const hand = polar(elbow, 100, 90 - (180 - angle));
      body += seg(shoulder, elbow);
      body += `<line x1="${elbow[0]}" y1="${elbow[1]}" x2="${hand[0]}" y2="${hand[1]}" stroke="${hi}" stroke-width="22" stroke-linecap="round"/>`;
    } else {
      // 0 degrees hangs straight down, 90 is level with the shoulder.
      const hand = polar(shoulder, 170, -90 + angle);
      body += `<line x1="${shoulder[0]}" y1="${shoulder[1]}" x2="${hand[0]}" y2="${hand[1]}" stroke="${hi}" stroke-width="22" stroke-linecap="round"/>`;
      body += seg(shoulder, [226, 300]);
    }
  }
  return frame(body);
}

export function fallbackSvg(t: TileSpec): string {
  switch (t.kind) {
    case "time":
      return timeTile(t.time);
    case "dose":
      return doseTile(t.form, t.count);
    case "unit":
      return doseTile(t.form, 1);
    case "meal":
      return mealTile();
    case "avoid":
      return markerTile("!");
    case "warning":
      return markerTile("!");
    case "exercise":
      return exerciseTile(t.movement, t.angle);
  }
}

export function fallbackDataUrl(t: TileSpec): string {
  return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg(t)).toString("base64")}`;
}
