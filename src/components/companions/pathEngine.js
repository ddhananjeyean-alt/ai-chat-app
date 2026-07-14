// Border path engine
// Returns x, y and rotation for an object moving
// around the entire browser/application border.

export const MOUSE_SIZE = 20;
export const CAT_SIZE = 24;

export function getBorderPosition(progress, size = 20, margin = 8) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const left = margin;
  const top = margin;
  const right = width - size - margin;
  const bottom = height - size - margin;

  const topLength = right - left;
  const rightLength = bottom - top;
  const bottomLength = topLength;
  const leftLength = rightLength;

  const total =
    topLength +
    rightLength +
    bottomLength +
    leftLength;

  let d = ((progress % total) + total) % total;

  // TOP
  if (d < topLength) {
    return {
      x: left + d,
      y: top,
      rotation: 0,
    };
  }

  d -= topLength;

  // RIGHT
  if (d < rightLength) {
    return {
      x: right,
      y: top + d,
      rotation: 90,
    };
  }

  d -= rightLength;

  // BOTTOM
  if (d < bottomLength) {
    return {
      x: right - d,
      y: bottom,
      rotation: 180,
    };
  }

  d -= bottomLength;

  // LEFT
  return {
    x: left,
    y: bottom - d,
    rotation: -90,
  };
}

export function getTotalBorderLength(size = 20, margin = 8) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const w = width - size - margin * 2;
  const h = height - size - margin * 2;

  return (w + h) * 2;
}