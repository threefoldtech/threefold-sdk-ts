import moment from "moment";

export default function toHumanDate(timeInSeconds: number): string {
  return moment(timeInSeconds * 1000).format("DD MMM YYYY, hh:mm A");
}

/**
 * Checks if a release date is within the last 30 days from the current date.
 *
 * @param {Date} releaseDate - The date of release
 * @param {Date} currentDate - The current date
 * @returns {boolean} True if the release date is within the last 30 days, false otherwise
 */

export function isReleasedOverMon(releaseDate: Date, currentDate: Date): boolean {
  const millisecondsInADay = 24 * 60 * 60 * 1000;
  const diff = Math.abs((currentDate.getTime() - releaseDate.getTime()) / millisecondsInADay);
  return diff <= 30;
}
