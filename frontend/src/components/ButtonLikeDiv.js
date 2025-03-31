import { styled } from "@mui/material/styles";

// Create a styled div that looks exactly like a MUI Button
const ButtonLikeDiv = styled("div")(
  ({
    theme,
    variant = "contained",
    color = "primary",
    size = "medium",
    disabled = false,
  }) => {
    const buttonColors = {
      primary: {
        bg: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        hoverBg: theme.palette.primary.dark,
      },
      secondary: {
        bg: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,
        hoverBg: theme.palette.secondary.dark,
      },
      success: {
        bg: theme.palette.success.main,
        color: theme.palette.success.contrastText,
        hoverBg: theme.palette.success.dark,
      },
      error: {
        bg: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        hoverBg: theme.palette.error.dark,
      },
    };

    const selectedColor = buttonColors[color] || buttonColors.primary;

    const sizeStyles = {
      small: {
        padding: "4px 10px",
        fontSize: "0.8125rem",
      },
      medium: {
        padding: "6px 16px",
        fontSize: "0.875rem",
      },
      large: {
        padding: "8px 22px",
        fontSize: "0.9375rem",
      },
    };

    const selectedSize = sizeStyles[size] || sizeStyles.medium;

    return {
      // Base button styling
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxSizing: "border-box",
      WebkitTapHighlightColor: "transparent",
      outline: 0,
      border: 0,
      margin: 0,
      cursor: disabled ? "default" : "pointer",
      userSelect: "none",
      verticalAlign: "middle",
      textDecoration: "none",
      fontFamily: theme.typography.fontFamily,
      fontWeight: theme.typography.button.fontWeight,
      lineHeight: 1.75,
      letterSpacing: "0.02857em",
      textTransform: "uppercase",
      minWidth: 64,
      borderRadius: theme.shape.borderRadius,
      transition: theme.transitions.create(
        ["background-color", "box-shadow", "border-color"],
        {
          duration: theme.transitions.duration.short,
        }
      ),

      // Size-specific styles
      ...selectedSize,

      // Variant-specific styles
      ...(variant === "contained" && {
        backgroundColor: disabled
          ? theme.palette.action.disabledBackground
          : selectedColor.bg,
        color: disabled ? theme.palette.action.disabled : selectedColor.color,
        boxShadow: theme.shadows[2],
        "&:hover": {
          backgroundColor: disabled
            ? theme.palette.action.disabledBackground
            : selectedColor.hoverBg,
          boxShadow: theme.shadows[4],
        },
        "&:active": {
          boxShadow: theme.shadows[8],
        },
      }),

      ...(variant === "outlined" && {
        border: `1px solid ${
          disabled ? theme.palette.action.disabled : selectedColor.bg
        }`,
        backgroundColor: "transparent",
        color: disabled ? theme.palette.action.disabled : selectedColor.bg,
        "&:hover": {
          backgroundColor: disabled
            ? "transparent"
            : theme.palette.action.hover,
          border: `1px solid ${
            disabled ? theme.palette.action.disabled : selectedColor.bg
          }`,
        },
      }),

      ...(variant === "text" && {
        backgroundColor: "transparent",
        color: disabled ? theme.palette.action.disabled : selectedColor.bg,
        "&:hover": {
          backgroundColor: disabled
            ? "transparent"
            : theme.palette.action.hover,
        },
      }),

      // Focus and disabled styles
      "&:focus-visible": {
        boxShadow: `0 0 0 4px ${theme.palette.action.focus}`,
      },

      // Add pointer cursor and opacity for disabled state
      opacity: disabled ? 0.7 : 1,
    };
  }
);

export default ButtonLikeDiv;
