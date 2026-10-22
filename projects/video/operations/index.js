// Operation registry of the projects service (ADD T-01): one module per
// operation with {name, versions, cost(parameters), validate(parameters,
// inputProps, profile), estimate(inputProps, parameters), copyable(inputProps,
// parameters)} and, for the conversion only, outputContainer(parameters).
// Concrete operations are added by later bolts, one entry each (B004+).
const MODULES = [];
MODULES.push(require("./trim"));
MODULES.push(require("./remove_audio"));
MODULES.push(require("./speed"));
MODULES.push(require("./watermark"));
MODULES.push(require("./adjust"));
MODULES.push(require("./filter"));
MODULES.push(require("./resize"));
MODULES.push(require("./orient"));

if (process.env.VIDEO_TEST_OPERATIONS === "1") {
  MODULES.push(require("./test_reencode"));
}

function createRegistry(modules = MODULES) {
  const byName = new Map(modules.map((op) => [op.name, op]));

  return {
    get(name) {
      return byName.get(name) || null;
    },
    names() {
      return [...byName.keys()];
    },
  };
}

module.exports = { createRegistry, registry: createRegistry() };
