const fs = require("fs");
function updateCache(summary, path) {
  const data = {
    summary,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(path, JSON.stringify(data));
}

function isLessThan24Hours(timestamp) {
  const now = Date.now();
  const difference = now - timestamp;
  const hours = 24;
  return difference < hours * 60 * 60 * 1000;
}

const DUMMY_DATA = {
  capacity: "17.46 PB",
  ssd: "8,108,670 GB",
  nodes: 2081,
  countries: 52,
  cores: 59828,
};
function readCache(path) {
  try {
    const cache = JSON.parse(fs.readFileSync(path));
    if (cache.summary) {
      const validCache = isLessThan24Hours(cache.updatedAt);
      return {
        summary: cache.summary,
        valid: validCache,
      };
    } else throw "Invalid cache";
  } catch (error) {
    return {
      summary: DUMMY_DATA,
      valid: false,
      error,
    };
  }
}

export default {
  updateCache,
  readCache,
};
