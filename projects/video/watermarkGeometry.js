// Geometry of the watermark in presentation pixels (D-61): the width is
// scale x frame width, the height follows the mark's own proportion, and the
// presets keep a margin of 3% of the smaller frame dimension.
const PRESETS = ["top-left", "top-right", "bottom-left", "bottom-right", "center"];
const MARGIN_RATIO = 0.03;

function markBox(parameters, props) {
  const frameWidth = props.displayWidth;
  const frameHeight = props.displayHeight;
  const mark = parameters._mark;
  const width = Math.max(1, Math.round(parameters.scale * frameWidth));
  const height = Math.max(1, Math.round((width * mark.height) / mark.width));
  const position = parameters.position;
  let x = position.x;
  let y = position.y;
  if (position.preset) {
    const margin = Math.round(MARGIN_RATIO * Math.min(frameWidth, frameHeight));
    const right = frameWidth - width - margin;
    const bottom = frameHeight - height - margin;
    const centerX = Math.round((frameWidth - width) / 2);
    const centerY = Math.round((frameHeight - height) / 2);
    [x, y] = {
      "top-left": [margin, margin],
      "top-right": [right, margin],
      "bottom-left": [margin, bottom],
      "bottom-right": [right, bottom],
      center: [centerX, centerY],
    }[position.preset];
  }
  return { x, y, width, height, frameWidth, frameHeight };
}

// RN3 of UC-VID-004: the mark lies entirely inside the frame.
function boundsError(parameters, box) {
  const preset = Boolean(parameters.position.preset);
  const fail = (field, limit) => [
    { code: "WATERMARK_OUT_OF_BOUNDS", field, ...(limit === undefined ? {} : { limit }) },
  ];
  if (preset) {
    if (
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > box.frameWidth ||
      box.y + box.height > box.frameHeight
    )
      return fail("scale");
    return [];
  }
  if (box.width > box.frameWidth || box.height > box.frameHeight)
    return fail("scale");
  if (box.x < 0 || box.x + box.width > box.frameWidth)
    return fail("position.x", { min: 0, max: box.frameWidth - box.width });
  if (box.y < 0 || box.y + box.height > box.frameHeight)
    return fail("position.y", { min: 0, max: box.frameHeight - box.height });
  return [];
}

module.exports = { PRESETS, MARGIN_RATIO, markBox, boundsError };
