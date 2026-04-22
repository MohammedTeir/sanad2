// components/NotificationPanel.tsx
import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  timestamp: string;
  data?: any;
}

interface NotificationPanelProps {
  userId: string;
  role: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ userId, role }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data for notifications
  useEffect(() => {
    // In a real implementation, this would connect to WebSocket and fetch notifications
    const mockNotifications: Notification[] = [
      {
        id: 'notif1',
        type: 'low_stock',
        title: 'انخفاض المخزون',
        message: 'انخفاض في مخزون الأرز - الكمية الحالية: 15',
        priority: 'high',
        read: false,
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 'notif2',
        type: 'transfer_request',
        title: 'طلب نقل جديد',
        message: 'طلب نقل لعائلة أحمد محمد من مخيم الأمل إلى مخيم الكرامة',
        priority: 'medium',
        read: false,
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      },
      {
        id: 'notif3',
        type: 'new_registration',
        title: 'تسجيل جديد',
        message: 'تم تسجيل عائلة جديدة: فاطمة علي (نقطة هشاشة: 85%)',
        priority: 'low',
        read: true,
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
    setLoading(false);
    
    // In a real implementation, this would set up WebSocket connection
    // const ws = new WebSocket('ws://localhost:3001/notifications');
    // ws.onmessage = (event) => {
    //   const newNotification = JSON.parse(event.data);
    //   setNotifications(prev => [newNotification, ...prev]);
    //   setUnreadCount(prev => prev + 1);
    // };
  }, [userId, role]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => prev - 1);
    
    // In a real implementation, this would call the backend API
    console.log(`Marking notification ${id} as read`);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
    
    // In a real implementation, this would call the backend API
    console.log('Marking all notifications as read');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `${diffMins} دقيقة`;
    if (diffHours < 24) return `${diffHours} ساعة`;
    return `${diffDays} يوم`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return '📦';
      case 'transfer_request': return '🚗';
      case 'new_registration': return '👥';
      case 'emergency_report': return '🚨';
      case 'campaign_update': return '📢';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-emerald-600 focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-emerald-600 hover:text-emerald-800"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-2">جاري التحميل...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                      </div>
                      <div className="mr-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'high' ? 'عالي' : 
                             notification.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </span>
                        </div>
                        <p className={`mt-1 text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-emerald-600 hover:text-emerald-800 text-sm"
                        >
                          تعليم كمقروء
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 text-center">
            <button className="text-sm text-emerald-600 hover:text-emerald-800">
              عرض كل الإشعارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;