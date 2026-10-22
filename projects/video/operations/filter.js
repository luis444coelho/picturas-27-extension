const reencodedProps = require("./reencodedProps");
const catalog = require("../filters.json");

// UC-VID-009 (ADD 4.4): one filter of the closed catalog (DQ-021, D-58).
const IDS = catalog.map((entry) => entry.id);

module.exports = {
  name: "filter",
  versions: [1],
  cost: () => 1,
  validate(parameters) {
    if (!IDS.includes(parameters.filter))
      return [{ code: "INVALID_FILTER", field: "filter", allowed: IDS }];
    return [];
  },
  estimate: (inputProps) => reencodedProps(inputProps),
  copyable: () => ({ video: false, audio: true }),
};
