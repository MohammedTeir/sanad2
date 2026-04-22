/**
 * Converts decimal coordinates to Degrees, Minutes, Seconds (DMS) format
 * Example: 31.395699 -> 31° 23' 44.518''
 */
export const decimalToDMS = (decimal: number, isLatitude: boolean): string => {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(3);

  const direction = isLatitude 
    ? (decimal >= 0 ? 'N' : 'S') 
    : (decimal >= 0 ? 'E' : 'W');

  return `${direction} ${degrees}° ${minutes}' ${seconds}''`;
};

/**
 * Generates the full technical coordinate string requested by the user
 */
export const formatFullCoordinateString = (lat: number, lng: number): string => {
  const latDMS = decimalToDMS(lat, true);
  const lngDMS = decimalToDMS(lng, false);

  return `Latitude: ${lat.toFixed(6)} / ${latDMS}\nLongitude: ${lng.toFixed(6)} / ${lngDMS}`;
};
