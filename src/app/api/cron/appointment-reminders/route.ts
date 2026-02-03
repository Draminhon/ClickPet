import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Service from '@/models/Service';
import notificationService from '@/lib/notification-service';
import { addDays, isTomorrow, format } from 'date-fns';

/**
 * Cron job to send appointment reminders 24 hours before
 * This should be run daily (e.g., via a cron service or Vercel Cron)
 */
export async function sendAppointmentReminders() {
    try {
        await dbConnect();

        // Get tomorrow's date range
        const tomorrow = addDays(new Date(), 1);
        const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

        // Find all appointments scheduled for tomorrow
        const appointments = await Appointment.find({
            date: {
                $gte: startOfTomorrow,
                $lte: endOfTomorrow,
            },
            status: { $in: ['pending', 'confirmed'] },
        }).populate('serviceId userId');

        console.log(`Found ${appointments.length} appointments for tomorrow`);

        // Send reminder for each appointment
        for (const appointment of appointments) {
            try {
                const service = appointment.serviceId as any;
                const serviceName = service?.title || 'Serviço';

                await notificationService.notifyAppointmentReminder(
                    appointment.userId,
                    appointment._id.toString(),
                    serviceName,
                    appointment.date,
                    appointment.time
                );

                console.log(`Sent reminder for appointment ${appointment._id}`);
            } catch (error) {
                console.error(`Failed to send reminder for appointment ${appointment._id}:`, error);
            }
        }

        return {
            success: true,
            remindersSent: appointments.length,
        };
    } catch (error) {
        console.error('Error sending appointment reminders:', error);
        throw error;
    }
}

// Export as API route for manual triggering or cron
export async function GET() {
    try {
        const result = await sendAppointmentReminders();
        return Response.json(result);
    } catch (error: any) {
        return Response.json(
            { error: error.message || 'Failed to send reminders' },
            { status: 500 }
        );
    }
}
