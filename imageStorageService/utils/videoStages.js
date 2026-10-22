// Storage stages for video objects (ADD T-08). Kept apart from utils/stages.js so
// image routes keep refusing video stages and vice versa. No video_zip (D-06).
module.exports = ["video_src", "video_out", "video_preview", "video_thumb"];
