/**
 * Formats the size of a resource in a human-readable format.
 * @param sizeInBytes - The size of the resource in bytes.
 * @returns A formatted string representing the size of the resource.
 */
export default function formatResourceSize(sizeInBytes?: number, speed?: boolean): string {
  if (sizeInBytes === undefined || sizeInBytes === null || isNaN(sizeInBytes) || sizeInBytes === 0) {
    return "0";
  }

  const kilo = 1024;
  const mega = 1024 ** 2;
  const giga = 1024 ** 3; // One gigabyte in bytes
  const tera = 1024 ** 4; // One terabyte in bytes
  const peta = 1024 ** 5; // One petabyte in bytes

  if (sizeInBytes < kilo) {
    return sizeInBytes.toString() + " Bytes";
  }

  if (sizeInBytes < mega) {
    const sizeInKilo = sizeInBytes / kilo;
    return (speed ? formatSpeed(sizeInKilo) : toFixedTwo(sizeInKilo)) + " KB";
  }

  if (sizeInBytes < giga) {
    const sizeInMega = sizeInBytes / mega;
    return (speed ? formatSpeed(sizeInMega) : toFixedTwo(sizeInMega)) + " MB";
  }

  if (sizeInBytes < tera) {
    const sizeInGB = sizeInBytes / giga;
    return (speed ? formatSpeed(sizeInGB) : toFixedTwo(sizeInGB)) + " GB";
  }

  if (sizeInBytes < peta) {
    const sizeInTB = sizeInBytes / tera;
    return (speed ? formatSpeed(sizeInTB) : toFixedTwo(sizeInTB)) + " TB";
  }

  const sizeInPB = sizeInBytes / peta;
  return (speed ? formatSpeed(sizeInPB) : toFixedTwo(sizeInPB)) + " PB";
}

function toFixedTwo(val: number) {
  return Math.floor(val * 100) / 100;
}

function formatSpeed(val: number) {
  return Math.round(val);
}

export function toTeraOrGigaStats(sizeInBytes: number) {
  const giga = 1024 ** 3;

  if (!sizeInBytes) return "0 GB";

  const val = +sizeInBytes;
  if (val === 0 || isNaN(val)) return "0 GB";

  const gb = val / giga;

  if (gb < 100) {
    return gb.toFixed(2) + " GB";
  }

  const tb = gb / 1024;
  return tb.toFixed(2) + " TB";
}
