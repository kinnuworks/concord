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
const MOVE = "#C8321F";
const rad = (deg: number) => (deg * Math.PI) / 180;
const limb = (a: Pt, b: Pt, colour = INK, w = 24) =>
  `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${colour}" stroke-width="${w}" stroke-linecap="round"/>`;
// A point at a distance from an origin. 0 degrees points right, angles turn anticlockwise.
const polar = (o: Pt, len: number, deg: number): Pt => [o[0] + len * Math.cos(rad(deg)), o[1] - len * Math.sin(rad(deg))];

// A dashed arc between two directions, with the angle written beside it.
function angleMark(centre: Pt, from: number, to: number, shown: number, labelGap = 46) {
  const r = 64;
  const steps = 24;
  const pts = Array.from({ length: steps + 1 }, (_, i) => polar(centre, r, from + ((to - from) * i) / steps));
  const mid = polar(centre, r + labelGap, (from + to) / 2);
  return `<polyline points="${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" fill="none" stroke="${MOVE}" stroke-width="6" stroke-dasharray="3 11" stroke-linecap="round"/><text x="${mid[0].toFixed(1)}" y="${(mid[1] + 14).toFixed(1)}" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="${MOVE}">${Math.round(shown)}\u00B0</text>`;
}

// A figure drawn by code with the moving joint at exactly the prescribed angle.
// The body is ink, the moving limb is red, and the angle is written out.
export function exerciseSvg(movement: string, angle: number): string {
  let body = "";
  if (movement === "knee_bend" || movement === "straight_leg_raise") {
    // A person lying on a mat, head to the left. The resting leg is ink, the moving leg red.
    const floor = 322;
    const hip: Pt = [250, 290];
    const shoulder: Pt = [116, 290];
    const heel: Pt = [462, 290];
    body += `<rect x="24" y="${floor - 6}" width="464" height="16" rx="8" fill="#E4E6EB"/>`;
    body += `<circle cx="72" cy="282" r="30" fill="#fff" stroke="${INK}" stroke-width="14"/>`;
    body += limb(shoulder, hip, INK, 30) + limb(hip, heel) + limb(heel, [468, 258], INK, 16);
    if (movement === "straight_leg_raise") {
      const end = polar(hip, 208, angle);
      body += limb(hip, end, MOVE) + limb(end, polar(end, 30, angle + 90), MOVE, 16);
      body += angleMark(hip, 0, angle, angle, 96);
    } else {
      // The heel stays on the mat. Thigh and shin meet at the knee at the prescribed angle.
      const L = 112;
      const half = rad(angle / 2);
      const knee: Pt = [hip[0] + L * Math.sin(half), hip[1] - L * Math.cos(half)];
      const foot: Pt = [hip[0] + 2 * L * Math.sin(half), hip[1]];
      body += limb(hip, knee, MOVE) + limb(knee, foot, MOVE) + limb(foot, [foot[0] + 30, foot[1] - 4], MOVE, 16);
      const toHip = (Math.atan2(knee[1] - hip[1], hip[0] - knee[0]) * 180) / Math.PI;
      const toFoot = (Math.atan2(knee[1] - foot[1], foot[0] - knee[0]) * 180) / Math.PI;
      body += angleMark(knee, toHip, toFoot - 0, angle).replace(/<text[^>]*>/, (m) => m.replace(/y="[^"]*"/, `y="${(knee[1] - 26).toFixed(1)}"`).replace(/x="[^"]*"/, `x="${knee[0].toFixed(1)}"`));
    }
  } else {
    const shoulder: Pt = [256, 168];
    const hip: Pt = [256, 318];
    body += `<line x1="150" y1="478" x2="362" y2="478" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
    body += `<circle cx="256" cy="104" r="34" fill="#fff" stroke="${INK}" stroke-width="14"/>`;
    body += limb(shoulder, hip) + limb(hip, [226, 466]) + limb(hip, [286, 466]);
    if (movement === "elbow_bend") {
      const elbow: Pt = [256, 276];
      // 180 degrees is a straight arm hanging down; smaller angles bring the hand up in front.
      const hand = polar(elbow, 104, 270 + (180 - angle));
      body += limb(shoulder, elbow, MOVE) + limb(elbow, hand, MOVE);
      body += angleMark(elbow, 90, 270 + (180 - angle) - 360, angle);
    } else {
      // 0 degrees hangs straight down, 90 is level with the shoulder.
      body += limb(shoulder, [232, 300], INK, 20);
      body += limb(shoulder, polar(shoulder, 170, 270 + angle), MOVE);
      body += angleMark(shoulder, 270, 270 + angle, angle);
    }
  }
  return frame(body);
}

// Works in the browser and on the server.
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
      return exerciseSvg(t.movement, t.angle);
  }
}

export function fallbackDataUrl(t: TileSpec): string {
  return svgDataUrl(fallbackSvg(t));
}
