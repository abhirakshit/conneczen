import { redirect } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {string} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 */
export function encodedRedirect(type, path, message) {
    return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Converts a UTC datetime string to a specific timezone and format.
 * @param {string} utcDateTime - The UTC datetime string.
 * @param {string} timezone - The target timezone.
 * @param {string} [format] - Optional format for the datetime.
 * @returns {string} - The formatted datetime string in the target timezone.
 */
export const convertUTCDateToLocalTZ = (utcDateTime, timezone, format) => {
    if (!utcDateTime || !timezone) {
        throw new Error("utcDateTime and timezone must be valid values.");
    }
    return dayjs(utcDateTime)
        .tz(timezone)
        .format(format || "YYYY MMM DD hh:mm A");
};

/**
 * Formats a given datetime string into a specific format.
 * @param {string} dateTime - The datetime string.
 * @param {string} format - The format to apply.
 * @returns {string} - The formatted datetime string.
 */
export const getFormattedDateTime = (dateTime, format) => {
    if (!dateTime) {
        console.error("dateTime is missing");
        return dayjs().format("YYYY MMM DD hh:mm A");
    }

    return dayjs(dateTime).format(format || "YYYY MM DD hh:mm A");
};


export const getTimezone = async (lat, lng, timestamp, apiKey) => {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
    );
    const data = await response.json();
    console.log("tzdata", data)
    return data.timeZoneId;
};
