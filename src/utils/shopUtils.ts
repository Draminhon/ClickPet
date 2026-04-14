
/**
 * Utility to check if a shop is currently open based on its working hours.
 */
export function isShopOpen(workingHours: any[]): boolean {
    if (!workingHours || workingHours.length === 0) return false;

    // Get current date/time in Brazilian timezone (standard for the app)
    const now = new Date();
    const brTime = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(now);

    const currentDay = brTime.find(p => p.type === 'weekday')?.value.toLowerCase() || '';
    const currentHour = parseInt(brTime.find(p => p.type === 'hour')?.value || '0');
    const currentMinute = parseInt(brTime.find(p => p.type === 'minute')?.value || '0');
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Find the schedule for the current day
    // The day in DB might be 'Segunda-feira' or 'segunda-feira'
    const todaySchedule = workingHours.find(h => 
        h.day.toLowerCase().replace('-feira', '') === currentDay.replace('-feira', '') ||
        h.day.toLowerCase() === currentDay
    );

    if (!todaySchedule || !todaySchedule.active) return false;

    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    // Handle normal case (08:00 - 18:00)
    if (openMinutes < closeMinutes) {
        return currentTimeMinutes >= openMinutes && currentTimeMinutes < closeMinutes;
    } 
    
    // Handle overnight case (e.g. 22:00 - 02:00)
    return currentTimeMinutes >= openMinutes || currentTimeMinutes < closeMinutes;
}
