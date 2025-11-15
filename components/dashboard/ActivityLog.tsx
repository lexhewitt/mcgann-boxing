
import React from 'react';
import { useData } from '../../context/DataContext';

const ActivityLog: React.FC = () => {
    const { auditLogs, members, coaches } = useData();
    const allUsers = [...members, ...coaches];

    return (
        <div>
            <h3 className="text-xl font-bold text-white mb-4">System Activity Log</h3>
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
                {auditLogs.length > 0 ? (
                    auditLogs.map(log => {
                        const actor = allUsers.find(u => u.id === log.actorId);
                        return (
                            <div key={log.id} className="bg-brand-dark p-3 rounded-md">
                                <p className="text-white font-medium">{log.details}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    By: {actor?.name || 'Unknown User'} on {new Date(log.timestamp).toLocaleString()}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-500 text-center py-8">No activity has been logged yet.</p>
                )}
            </div>
        </div>
    );
}

export default ActivityLog;