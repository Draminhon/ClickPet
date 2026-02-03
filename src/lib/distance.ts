// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function calculateDeliveryFee(
    distance: number,
    feePerKm: number,
    orderTotal: number,
    freeDeliveryMinimum: number
): number {
    // Free delivery if order total exceeds minimum
    if (freeDeliveryMinimum > 0 && orderTotal >= freeDeliveryMinimum) {
        return 0;
    }

    // Calculate fee based on distance
    const fee = distance * feePerKm;

    // Round to 2 decimal places
    return Math.round(fee * 100) / 100;
}
