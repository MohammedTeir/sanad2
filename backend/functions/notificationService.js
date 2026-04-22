// backend/functions/notificationService.js

/**
 * Notification Service
 * Handles real-time notifications and alerts
 */

// Import required modules
const WebSocket = require('ws');
const EventEmitter = require('events');

// In-memory store for connections (in production, use Redis or similar)
const connections = new Map();
const notificationEvents = new EventEmitter();

// Notification types
const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  TRANSFER_REQUEST: 'transfer_request',
  NEW_REGISTRATION: 'new_registration',
  EMERGENCY_REPORT: 'emergency_report',
  CAMPAIGN_UPDATE: 'campaign_update',
  SYSTEM_ALERT: 'system_alert'
};

/**
 * Initialize WebSocket server for real-time notifications
 */
function initializeWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws, req) => {
    // Extract user info from request (in real app, verify JWT)
    const userId = extractUserIdFromRequest(req);
    if (!userId) {
      ws.close(4001, 'Unauthorized');
      return;
    }
    
    // Store connection
    connections.set(userId, ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to notification service',
      timestamp: new Date().toISOString()
    }));
    
    // Handle messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        // Handle subscription requests
        if (message.type === 'subscribe') {
          // In a real implementation, store user's subscription preferences
          console.log(`User ${userId} subscribed to:`, message.channels);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      connections.delete(userId);
    });
  });
  
  return wss;
}

/**
 * Extract user ID from request (simplified)
 */
function extractUserIdFromRequest(req) {
  // In a real implementation, verify JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Decode JWT and extract user ID
  // This is simplified - in real app, use proper JWT verification
  try {
    const token = authHeader.substring(7);
    // In real app: return jwt.verify(token, secret).userId;
    return 'user123'; // Mock user ID
  } catch (error) {
    return null;
  }
}

/**
 * Send notification to specific user
 */
function sendNotificationToUser(userId, notification) {
  const ws = connections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(notification));
    return true;
  }
  return false;
}

/**
 * Broadcast notification to all connected users
 */
function broadcastNotification(notification) {
  let sentCount = 0;
  
  for (const [userId, ws] of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
      sentCount++;
    }
  }
  
  return sentCount;
}

/**
 * Send notification to users based on role
 */
function sendNotificationByRole(role, notification) {
  let sentCount = 0;
  
  for (const [userId, ws] of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      // In real app, check user's role
      // For now, send to all
      ws.send(JSON.stringify(notification));
      sentCount++;
    }
  }
  
  return sentCount;
}

/**
 * Create and send a low stock notification
 */
function sendLowStockNotification(itemName, currentQuantity, threshold, campId) {
  const notification = {
    id: `notif_${Date.now()}`,
    type: NOTIFICATION_TYPES.LOW_STOCK,
    title: 'انخفاض المخزون',
    message: `انخفاض في مخزون "${itemName}" - الكمية الحالية: ${currentQuantity}`,
    priority: 'high',
    data: {
      itemName,
      currentQuantity,
      threshold,
      campId
    },
    timestamp: new Date().toISOString()
  };
  
  // Send to camp managers and system admins
  return sendNotificationByRole(['CAMP_MANAGER', 'SYSTEM_ADMIN'], notification);
}

/**
 * Create and send a transfer request notification
 */
function sendTransferRequestNotification(requestId, fromCamp, toCamp, familyName) {
  const notification = {
    id: `notif_${Date.now()}`,
    type: NOTIFICATION_TYPES.TRANSFER_REQUEST,
    title: 'طلب نقل جديد',
    message: `طلب نقل جديد من ${fromCamp} إلى ${toCamp} لعائلة ${familyName}`,
    priority: 'medium',
    data: {
      requestId,
      fromCamp,
      toCamp,
      familyName
    },
    timestamp: new Date().toISOString()
  };
  
  // Send to camp managers of both camps and system admins
  return sendNotificationByRole(['CAMP_MANAGER', 'SYSTEM_ADMIN'], notification);
}

/**
 * Create and send a new registration notification
 */
function sendNewRegistrationNotification(familyId, familyName, vulnerabilityScore) {
  const notification = {
    id: `notif_${Date.now()}`,
    type: NOTIFICATION_TYPES.NEW_REGISTRATION,
    title: 'تسجيل جديد',
    message: `تم تسجيل عائلة جديدة: ${familyName} (نقطة هشاشة: ${vulnerabilityScore}%)`,
    priority: 'low',
    data: {
      familyId,
      familyName,
      vulnerabilityScore
    },
    timestamp: new Date().toISOString()
  };
  
  // Send to camp managers and system admins
  return sendNotificationByRole(['CAMP_MANAGER', 'SYSTEM_ADMIN'], notification);
}

/**
 * Create and send an emergency report notification
 */
function sendEmergencyReportNotification(reportId, category, location, priority) {
  const notification = {
    id: `notif_${Date.now()}`,
    type: NOTIFICATION_TYPES.EMERGENCY_REPORT,
    title: 'تقرير طوارئ',
    message: `تقرير طوارئ جديد (${category}) في ${location}`,
    priority: priority,
    data: {
      reportId,
      category,
      location,
      priority
    },
    timestamp: new Date().toISOString()
  };
  
  // Send to all managers and system admins
  return sendNotificationByRole(['CAMP_MANAGER', 'FIELD_OFFICER', 'SYSTEM_ADMIN'], notification);
}

/**
 * Create and send a campaign update notification
 */
function sendCampaignUpdateNotification(campaignId, campaignName, updateType) {
  const notification = {
    id: `notif_${Date.now()}`,
    type: NOTIFICATION_TYPES.CAMPAIGN_UPDATE,
    title: 'تحديث حملة',
    message: `تحديث في حملة "${campaignName}": ${updateType}`,
    priority: 'medium',
    data: {
      campaignId,
      campaignName,
      updateType
    },
    timestamp: new Date().toISOString()
  };
  
  // Send to relevant users
  return sendNotificationByRole(['CAMP_MANAGER', 'FIELD_OFFICER', 'SYSTEM_ADMIN'], notification);
}

/**
 * Get user's notification history
 */
async function getUserNotifications(userId, limit = 50, offset = 0) {
  // In a real implementation, this would query the database
  // For now, return mock data
  return {
    notifications: [
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
        read: true,
        timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ],
    totalCount: 2
  };
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(userId, notificationId) {
  // In a real implementation, this would update the database
  // For now, return success
  return { success: true };
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead(userId) {
  // In a real implementation, this would update the database
  // For now, return success
  return { success: true };
}

module.exports = {
  initializeWebSocketServer,
  sendNotificationToUser,
  broadcastNotification,
  sendNotificationByRole,
  sendLowStockNotification,
  sendTransferRequestNotification,
  sendNewRegistrationNotification,
  sendEmergencyReportNotification,
  sendCampaignUpdateNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NOTIFICATION_TYPES
};