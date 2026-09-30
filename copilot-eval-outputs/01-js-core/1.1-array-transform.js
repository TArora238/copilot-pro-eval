/**
 * Converts a duration in minutes to a readable string.
 *
 * @param {number} minutes Duration in minutes.
 * @returns {string} Formatted duration, for example "2h 35m".
 */
function formatDuration(minutes) {
  const totalMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Returns a user-friendly label for a flight status.
 *
 * @param {string} status Flight status code.
 * @returns {string} Display label.
 */
function getStatusLabel(status) {
  const labels = {
    ON_TIME: "On time",
    DELAYED: "Delayed",
    CANCELLED: "Cancelled",
    BOARDING: "Boarding"
  };

  return labels[status] || "Unknown";
}

/**
 * Formats an ISO date string as a UTC HH:mm time.
 *
 * @param {string} isoDateTime ISO 8601 date-time string.
 * @returns {string} Time formatted as HH:mm.
 */
function formatDepartureTime(isoDateTime) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(new Date(isoDateTime));
}

/**
 * Filters, formats, sorts, and groups flights by airline.
 *
 * @param {Array<Object>} flights Raw flight records.
 * @returns {Object<string, Array<Object>>} Display flights grouped by airline code.
 */
function buildFlightsByAirline(flights) {
  return flights
    .filter((flight) =>
      ["ON_TIME", "BOARDING"].includes(flight.status)
    )
    .map((flight) => {
      const departureDate = new Date(flight.departureTime);
      const arrivalDate = new Date(flight.arrivalTime);
      const durationMinutes = Math.round(
        (arrivalDate.getTime() - departureDate.getTime()) / 60000
      );

      return {
        id: flight.id,
        airline: flight.airline,
        route: `${flight.origin} \u2192 ${flight.destination}`,
        formattedDeparture: formatDepartureTime(flight.departureTime),
        durationMinutes,
        statusLabel: getStatusLabel(flight.status),
        isPremium: ["BUSINESS", "FIRST"].includes(flight.seatClass),

        // Keep this temporarily for chronological sorting, then remove it below.
        departureTime: flight.departureTime
      };
    })
    .sort(
      (firstFlight, secondFlight) =>
        new Date(firstFlight.departureTime) - new Date(secondFlight.departureTime)
    )
    .reduce((groupedFlights, flight) => {
      const { departureTime, ...displayFlight } = flight;

      if (!groupedFlights[flight.airline]) {
        groupedFlights[flight.airline] = [];
      }

      groupedFlights[flight.airline].push(displayFlight);
      return groupedFlights;
    }, {});
}

const flightsByAirline = buildFlightsByAirline(flights);

// Example: formatDuration(flightsByAirline.LH[0].durationMinutes); // "3h 15m"