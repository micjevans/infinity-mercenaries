import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [], // Queue of notifications
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    enqueueNotification: (state, action) => {
      state.notifications.push({
        key: new Date().getTime() + Math.random(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.key !== action.payload
      );
    },
  },
});

export const { enqueueNotification, removeNotification } =
  notificationsSlice.actions;

// Helper function to easily show notifications from anywhere
export const showNotification = (
  message,
  severity = "success",
  autoHideDuration = 6000
) => {
  return enqueueNotification({
    message,
    severity,
    autoHideDuration,
  });
};

export default notificationsSlice.reducer;
