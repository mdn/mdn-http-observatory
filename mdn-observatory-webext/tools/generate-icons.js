import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {{ [key: string]: string }} */
const colors = {
  A: "#d2fadd",
  ABorder: "#017a37",
  B: "#e8fad2",
  BBorder: "#547a01",
  C: "#faf8d2",
  CBorder: "#7a7001",
  D: "#fae8d2",
  DBorder: "#a65001",
  F: "#fad2d2",
  FBorder: "#a00",
  error: "#fff",
  errorBorder: "#333",
};

const grades = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
  "error",
];

async function generate() {
  for (const grade of grades) {
    const backgroundColor = colors[grade.replace(/[+-]/, "")] || "#f00";
    const borderColor = colors[`${grade.replace(/[+-]/, "")}Border`] || "#0ff";
    const svg = gradeSvg(backgroundColor, borderColor, grade);
    const filePath = path.join(dirname, "..", "assets", "img", `${grade}.png`);
    await convertSvgToPng(svg, filePath, 64);
    console.log(`Created ${filePath}`);
  }

  // Animations
  let ct = 1;
  for (let i = -20; i <= 40; i += 5) {
    const svg = iconSvg(i);
    const filePath = path.join(
      dirname,
      "..",
      "assets",
      "img",
      `icon-anim-${ct}.png`
    );
    await convertSvgToPng(svg, filePath, 64);

    ct += 1;
  }

  // Main icon family
  const sizes = [16, 24, 32, 64, 96, 128];
  const iconSvgData = iconSvg();
  for (const size of sizes) {
    const filePath = path.join(
      dirname,
      "..",
      "assets",
      "img",
      `${size}x${size}.png`
    );
    await convertSvgToPng(iconSvgData, filePath, size);
    console.log(`Created ${filePath}`);
  }

  // Main icon
  const filePath = path.join(dirname, "..", "assets", "img", "icon.png");
  await convertSvgToPng(iconSvgData, filePath, 128);
  console.log(`Created ${filePath}`);
}

/**
 * @param {string} backgroundColor
 * @param {string} borderColor
 * @param {string} grade
 */
function gradeSvg(backgroundColor, borderColor, grade) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <svg width="128" height="128" id="svg1" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
        <defs id="defs1" />
        <g id="layer1">
            <rect
              style="fill:${backgroundColor};stroke:${borderColor};stroke-width:2;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
              id="rect4" width="124" height="124" x="2" y="2" ry="5" />
            <text x="0" y="0" id="text1">
              <tspan id="tspan1"
                  style="font-style:normal;font-variant:normal;font-weight:600;font-stretch:normal;font-size:80px;font-family:Inter;text-align:center;text-anchor:middle;fill:${borderColor};"
                  x="64" y="92">
                  ${grade === "error" ? "?" : grade}
              </tspan>
            </text>
        </g>
      </svg>
    `;
}

function iconSvg(rotate = 0) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg version="1.1" x="0px" y="0px" viewBox="0 0 400 400" width="400" height="400" xmlns="http://www.w3.org/2000/svg"
          xmlns:svg="http://www.w3.org/2000/svg">
          <g id="g3" transform="translate(-89.269135,15.999077)">
            <path
              d="m 318.75,281.75 h -13.8 c -2.984,0.012 -5.481,-2.261 -5.75,-5.232 l -2.702,-31.338 c -32.697,-5.629 -62.35,-22.635 -83.721,-48.012 l -6.728,79.35 c -0.269,2.972 -2.766,5.244 -5.75,5.232 h -13.8 c -9.527,0 -17.25,7.723 -17.25,17.25 v 33.063 c 0.032,10.308 8.38,18.656 18.688,18.688 h 129.49 c 10.263,-0.095 18.541,-8.425 18.572,-18.688 V 299 C 336,289.473 328.277,281.75 318.75,281.75 Z"
              id="path1" />

            <g transform="rotate(${rotate}, 320, 104)">
              <path
                d="M 404.195,180.665 245.897,22.368 c -1.642,-1.639 -3.598,-2.93 -5.75,-3.795 l -1.897,-0.575 -1.667,-0.402 c -1.135,-0.234 -2.291,-0.35 -3.45,-0.345 h -0.633 -0.862 c -1.059,0.072 -2.103,0.285 -3.105,0.632 -0.521,0.066 -1.027,0.222 -1.495,0.46 l -1.725,0.748 c -1.605,0.876 -3.061,2.002 -4.313,3.335 l -1.38,1.495 c -21.51,26.706 -31.614,60.82 -28.118,94.933 5.776,56.94 48.095,103.414 104.248,114.482 3.967,0.747 8.05,1.38 12.133,1.782 4.082,0.402 8.854,0.633 13.225,0.633 5.46,0.001 10.914,-0.345 16.33,-1.035 2.3,0 4.543,-0.633 6.842,-1.035 2.301,-0.402 4.543,-0.862 6.785,-1.438 l 4.198,-1.092 c 0.188,0.051 0.387,0.051 0.575,0 v 0 L 359,230 v 0 l 1.897,-0.633 2.07,-0.689 c 0.409,-0.089 0.813,-0.204 1.207,-0.346 0.921,0 1.782,-0.747 2.702,-1.035 l 1.668,-0.689 c 2.127,-0.805 4.255,-1.725 6.325,-2.645 h 0.288 l 3.909,-1.84 v 0 l 3.853,-2.014 c 2.013,-1.092 4.025,-2.242 5.75,-3.449 L 402.584,207 c 3.972,-3.185 6.397,-7.911 6.67,-12.995 0.318,-4.968 -1.526,-9.832 -5.059,-13.34 z"
                id="path2" />
              <path
                d="M 337.897,98.152 370.5,65.78 c 3.488,2.055 7.452,3.165 11.5,3.22 12.703,0.045 23.036,-10.216 23.081,-22.919 C 405.126,33.379 394.865,23.045 382.162,23 c -12.702,-0.045 -23.036,10.216 -23.08,22.918 -0.016,4.065 1.048,8.061 3.08,11.581 l -32.43,32.373 z"
                id="path3" />
            </g>
            <g transform="translate(320, 104)">
              <rect width="2" height="2" x="0" y="0" fill="#f00" />
            </g>
          </g>
        </svg>      
      `;
}

/**
 * @param {string} svgData
 * @param {string} outputFilePath
 * @param {number} size
 */
async function convertSvgToPng(svgData, outputFilePath, size = 32) {
  try {
    await sharp(Buffer.from(svgData))
      .png()
      .sharpen({ sigma: 0.466 })
      .resize(size, size, { kernel: "mitchell" })
      .toFile(outputFilePath);
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
  }
}

generate().then(() => console.log("Done."));
