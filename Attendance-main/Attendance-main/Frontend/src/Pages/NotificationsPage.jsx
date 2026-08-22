import React, { useEffect, useState } from "react";
import { useNotifications } from "../Contexts/NotificationContext";
import { IoNotificationsOutline, IoCheckmarkDoneOutline, IoTimeOutline, IoMailUnreadOutline, IoMailOpenOutline } from "react-icons/io5";
import "./Styles/NotificationsPage.css";

const NotificationsPage = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState("all"); // all, unread, read

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-left">
          <IoNotificationsOutline className="header-icon" />
          <h1>Notifications</h1>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} New</span>}
        </div>
        <div className="header-right">
          <button 
            className="mark-all-btn" 
            onClick={markAllNotificationsAsRead}
            disabled={unreadCount === 0}
          >
            <IoCheckmarkDoneOutline /> Mark All as Read
          </button>
        </div>
      </div>

      <div className="notifications-container card">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === "all" ? "active" : ""}`} 
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === "unread" ? "active" : ""}`} 
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
          <button 
            className={`filter-tab ${filter === "read" ? "active" : ""}`} 
            onClick={() => setFilter("read")}
          >
            Read
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="no-notifications-state">
              <IoNotificationsOutline className="empty-icon" />
              <p>No {filter !== "all" ? filter : ""} notifications found.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`notification-card ${notif.isRead ? "read" : "unread"}`}
                onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
              >
                <div className="notif-status-icon">
                  {notif.isRead ? <IoMailOpenOutline className="read-icon" /> : <IoMailUnreadOutline className="unread-icon" />}
                </div>
                <div className="notif-content">
                  <p className="notif-message">{notif.message}</p>
                  <div className="notif-meta">
                    <span className="notif-time">
                      <IoTimeOutline /> {new Date(notif.createdAt).toLocaleString()}
                    </span>
                    {notif.sessionsMissing && notif.sessionsMissing.length > 0 && (
                      <span className="notif-sessions">
                        Sessions: {notif.sessionsMissing.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                {!notif.isRead && (
                  <button 
                    className="mark-read-single"
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(notif.id);
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
