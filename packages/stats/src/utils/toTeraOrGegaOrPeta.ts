export default function toTeraOrGiga(value?: string) {
  const giga = 1024 ** 3;

  if (!value) return "0";

  const val = +value;
  if (val === 0 || isNaN(val)) return "0";

  if (val < giga) return val.toString();

  let gb = val / giga;

  if (gb < 1024) return `${gb.toFixed(2)} GB`;

  gb = gb / 1024;

  if (gb < 1024) return `${gb.toFixed(2)} TB`;

  gb = gb / 1024;
  return `${gb.toFixed(2)} PB`;
}

export function formatNumberWithCommas(sizeInBytes: number) {
  const giga = 1024 ** 3;

  if (!sizeInBytes) return "0 GB";

  const gb = Math.round(sizeInBytes / giga).toString();

  let res = "";
  let count = 0;
  for (let i = gb.length - 1; i >= 0; i--) {
    res = gb[i] + res;
    count++;
    if (count % 3 === 0 && i !== 0) res = "," + res;
  }
  return res + " GB";
}
