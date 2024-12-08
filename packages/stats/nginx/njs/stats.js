import cache from "./cache.js";

const RETRIES = 3;
const cache_path = "/tmp/statsSummary.json";
let URLS = [
  "https://gridproxy.grid.tf/stats?status=up",
  "https://gridproxy.grid.tf/stats?status=standby",
  "https://gridproxy.test.grid.tf/stats?status=up",
  "https://gridproxy.test.grid.tf/stats?status=standby",
  "https://gridproxy.dev.grid.tf/stats?status=up",
  "https://gridproxy.dev.grid.tf/stats?status=standby",
];

async function getStats(r) {
  const cachedData = cache.readCache(cache_path);
  if (!cachedData.valid || cachedData.error) {
    await updateStats(r);
    return;
  }

  r.return(200, JSON.stringify(cachedData.summary));
}

async function updateStats(r) {
  try {
    const stats = await fetchStats(r);
    r.return(200, JSON.stringify(stats));
    return;
  } catch (error) {
    r.error(`Failed to fetch stats: ${error}`);
    r.error(`Returning cached data`);
    const cachedData = cache.readCache(cache_path);
    r.return(200, JSON.stringify(cachedData.summary));
    return;
  }
}
function initTargeRequests(urls) {
  return urls.map(url =>
    //   eslint-disable-next-line no-undef
    ngx.fetch(url, { verify: false }).then(res => res.json()),
  );
}
async function fetchStats(r) {
  let retries = 0;
  const stats = [];
  while (URLS.length !== 0 && retries < RETRIES) {
    const responses = await Promise.allSettled(initTargeRequests(URLS));
    const failedURls = [];
    responses.forEach((item, index) => {
      if (item.status === "fulfilled") {
        stats.push(item.value);
      } else {
        failedURls.push(URLS[index]);
      }
    });
    URLS = failedURls;
    if (URLS.length !== 0) retries++;
  }
  let result;
  if (retries >= 3 && URLS.length > 0) throw `Failed to get response form ${URLS} after ${retries} retries`;
  else result = mergeStatsData(stats);
  try {
    cache.updateCache(result, cache_path);
  } catch (err) {
    r.error(`Failed to update cache due to: ${err}`);
  }

  return result;
}

function mergeStatsData(stats) {
  const res = Object.assign({}, stats[0]);

  for (let i = 1; i < stats.length; i++) {
    if (stats[i]) {
      res.nodes += stats[i].nodes;
      res.totalCru += stats[i].totalCru;
      res.totalHru += stats[i].totalHru;
      res.totalSru += stats[i].totalSru;
      res.nodesDistribution = mergeNodeDistribution([res.nodesDistribution, stats[i].nodesDistribution]);
      res.countries = Object.keys(res.nodesDistribution).length;
    }
  }

  const result = {};
  result.capacity = toTeraOrGiga(res.totalHru + res.totalSru);
  result.ssd = toTeraOrGigaStats(res.totalSru);
  result.nodes = res.nodes;
  result.countries = res.countries;
  result.cores = res.totalCru;
  return result;
}

function mergeNodeDistribution(stats) {
  const keys = [];
  for (let i = 0; i < stats.length; i++) {
    const obj = stats[i];
    if (obj) {
      const objKeys = Object.keys(obj);
      for (let j = 0; j < objKeys.length; j++) {
        if (!keys.includes(objKeys[j])) keys.push(objKeys[j]);
      }
    }
  }

  const result = {};
  keys.forEach(function (key) {
    result[key] = 0;
    for (let i = 0; i < stats.length; i++) {
      const country = stats[i];
      result[key] += country ? country[key] || 0 : 0;
    }
  });

  return result;
}

function toTeraOrGiga(value) {
  const giga = 1024 ** 3;

  if (!value) return "0";

  const val = +value;
  if (val === 0 || isNaN(val)) return "0";

  if (val < giga) return val.toString();

  let gb = val / giga;

  if (gb < 1024) return gb.toFixed(2) + " GB";

  gb = gb / 1024;

  if (gb < 1024) return gb.toFixed(2) + " TB";

  gb = gb / 1024;
  return gb.toFixed(2) + " PB";
}

function toTeraOrGigaStats(value) {
  const giga = 1024 ** 3;

  if (!value) return "0 GB";

  const val = +value;
  if (val === 0 || isNaN(val)) return "0 GB";

  const gb = val / giga;

  if (gb < 100) {
    return gb.toFixed(2) + " GB";
  }

  const tb = gb / 1024;
  return tb.toFixed(2) + " TB";
}

// Exporting the main function for Nginx
export default { getStats, updateStats };
