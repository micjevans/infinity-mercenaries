import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Snackbar, Alert } from "@mui/material";
import {
  selectNotifications,
  removeNotification,
} from "../redux/notificationsSlice";

const NotificationCenter = () => {
  const notifications = useSelector(selectNotifications);
  const dispatch = useDispatch();

  const handleClose = (id) => {
    dispatch(removeNotification(id));
  };

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          // Add some vertical spacing between multiple notifications
          style={{
            bottom: `${
              notifications.findIndex((n) => n.id === notification.id) * 60 + 24
            }px`,
          }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationCenter;
