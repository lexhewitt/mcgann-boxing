
import React from 'react';
import { useData } from '../../context/DataContext';
import { ClassTransferNotification, NotificationStatus, UserRole, AppUser } from '../../types';
import Button from '../ui/Button';

interface NotificationsPanelProps {
    user: AppUser;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ user }) => {
    const { notifications, classes, coaches, acceptClassTransfer, cancelClassTransferRequest } = useData();

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
                        <p className="text-white">{message}</p>
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

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Notifications</h2>
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