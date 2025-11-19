
import React from 'react';
import { useData } from '../../context/DataContext';
import { ClassTransferNotification, NotificationStatus, UserRole, AppUser } from '../../types';
import Button from '../ui/Button';

interface NotificationsPanelProps {
    user: AppUser;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ user }) => {
    const { notifications, bookingAlerts, classes, coaches, acceptClassTransfer, cancelClassTransferRequest, acknowledgeBookingAlert } = useData();

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.COACH)) {
        return null;
    }

    const myIncomingRequests = notifications.filter(n => n.targetCoachId === user.id);
    const mySentRequests = notifications.filter(n => n.requestingCoachId === user.id);

    const handleAccept = (notificationId: string) => {
        if(window.confirm("Are you sure you want to accept this cover request? This will make you the coach for this class temporarily.")) {
            if(!user) return;
            acceptClassTransfer(notificationId, user);
        }
    };

    const handleCancel = (notificationId: string) => {
        if(window.confirm("Are you sure you want to cancel this cover request?")) {
            if(!user) return;
            cancelClassTransferRequest(notificationId, user);
        }
    };


    const StatusBadge: React.FC<{status: NotificationStatus}> = ({status}) => {
        const styles = {
            [NotificationStatus.PENDING]: 'bg-yellow-500',
            [NotificationStatus.ACCEPTED]: 'bg-green-600',
            [NotificationStatus.DECLINED]: 'bg-red-700',
            [NotificationStatus.UNDONE]: 'bg-gray-500',
            [NotificationStatus.CANCELED]: 'bg-gray-600 text-gray-300',
        };
        return <span className={`px-2 py-1 text-xs font-bold rounded ${styles[status]}`}>{status}</span>
    }

    const NotificationItem: React.FC<{notification: ClassTransferNotification}> = ({ notification }) => {
        const gymClass = classes.find(c => c.id === notification.classId);
        const requestingCoach = coaches.find(c => c.id === notification.requestingCoachId);
        const targetCoach = coaches.find(c => c.id === notification.targetCoachId);

        if (!gymClass || !requestingCoach || !targetCoach || !user) return null;
        const isPendingForUser = notification.status === NotificationStatus.PENDING &&
          (user.role === UserRole.ADMIN || notification.targetCoachId === user.id);

        let message = '';
        if (user.role === UserRole.ADMIN && user.id !== requestingCoach.id && user.id !== targetCoach.id) {
            // Admin view
            message = `${requestingCoach.name} requested ${targetCoach.name} to cover "${gymClass.name}".`;
        } else if (notification.targetCoachId === user.id) {
            // Incoming request
            message = `${requestingCoach.name} has requested you to cover their class: "${gymClass.name}".`;
        } else {
            // Outgoing request
            message = `You requested ${targetCoach.name} to cover your class: "${gymClass.name}".`;
        }

        return (
             <div className="bg-brand-dark p-3 rounded-md flex flex-col items-start gap-2">
                <div className="w-full flex justify-between items-start gap-4">
                    <div>
                        <p className="text-white flex items-center gap-2">
                            {message}
                            {isPendingForUser && (
                                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-brand-red text-white">
                                    New
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{gymClass.day}, {gymClass.time} &middot; Requested on {new Date(notification.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={notification.status} />
                        {notification.targetCoachId === user.id && notification.status === NotificationStatus.PENDING && (
                            <Button onClick={() => handleAccept(notification.id)} className="text-xs py-1 px-2">Accept</Button>
                        )}
                        {notification.requestingCoachId === user.id && notification.status === NotificationStatus.PENDING && (
                            <Button onClick={() => handleCancel(notification.id)} variant="secondary" className="text-xs py-1 px-2">Cancel</Button>
                        )}
                    </div>
                </div>
                {notification.note && (
                    <div className="w-full border-t border-gray-700 pt-2 mt-2">
                        <p className="text-sm italic text-gray-300">"{notification.note}"</p>
                    </div>
                )}
            </div>
        )
    };
    
    const renderSection = (title: string, data: ClassTransferNotification[]) => (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700">{title}</h3>
            {data.length > 0 ? (
                <div className="space-y-3">
                    {data.map(n => <NotificationItem key={n.id} notification={n} />)}
                </div>
            ) : (
                 <p className="text-gray-500 text-center py-4">No notifications in this category.</p>
            )}
        </div>
    );

    const bookingSection = () => {
        const rawRelevant = user.role === UserRole.ADMIN ? bookingAlerts : bookingAlerts.filter(alert => alert.coachId === user.id);
        const relevant: typeof rawRelevant = [];
        const seen = new Set<string>();
        rawRelevant.forEach(alert => {
            const key = user.role === UserRole.ADMIN
                ? `${alert.transactionId ?? ''}|${alert.guestBookingId ?? ''}|${alert.referenceId ?? ''}|${alert.participantName ?? ''}|${alert.timestamp}`
                : alert.id;
            if (!seen.has(key)) {
                seen.add(key);
                relevant.push(alert);
            }
        });
        if (relevant.length === 0) return null;
        return (
            <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700">Booking Notifications</h3>
                <div className="space-y-3">
                    {relevant.map(alert => {
                        const coach = coaches.find(c => c.id === alert.coachId);
                        return (
                            <div key={alert.id} className="bg-brand-dark p-3 rounded-md space-y-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="text-white">
                                        <p className="font-semibold">{alert.serviceType === 'PRIVATE' ? 'Private Session Booking' : 'Class Booking'}</p>
                                        <p className="text-sm text-gray-300 flex items-center gap-2">
                                            {alert.message}
                                            {alert.status === 'PENDING' && (
                                                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-brand-red text-white">
                                                    New
                                                </span>
                                            )}
                                        </p>
                                        {alert.participantName && <p className="text-xs text-gray-400 mt-1">Participant: {alert.participantName}</p>}
                                        {typeof alert.amount === 'number' && <p className="text-xs text-gray-400">Amount: £{alert.amount.toFixed(2)}</p>}
                                        {user.role === UserRole.ADMIN && coach && (
                                            <p className="text-xs text-gray-500">Coach: {coach.name}</p>
                                        )}
                                        {alert.confirmedBy && alert.confirmedAt && (
                                            <p className="text-xs text-green-400 mt-1">Confirmed by {alert.confirmedBy} on {new Date(alert.confirmedAt).toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${alert.status === 'PENDING' ? 'bg-yellow-500 text-black' : 'bg-green-600'}`}>
                                            {alert.status === 'PENDING' ? 'Awaiting confirmation' : 'Confirmed'}
                                        </span>
                                        {alert.status === 'PENDING' && (
                                            <Button onClick={() => acknowledgeBookingAlert(alert.id, user)} className="text-xs py-1 px-2">
                                                Mark confirmed
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Notifications</h2>
            {bookingSection()}
            {user.role === UserRole.ADMIN ? (
                renderSection("All Class Transfer Requests", notifications)
            ) : (
                <>
                    {renderSection("Incoming Requests", myIncomingRequests)}
                    {renderSection("My Sent Requests", mySentRequests)}
                </>
            )}
        </div>
    )
}

export default NotificationsPanel;
