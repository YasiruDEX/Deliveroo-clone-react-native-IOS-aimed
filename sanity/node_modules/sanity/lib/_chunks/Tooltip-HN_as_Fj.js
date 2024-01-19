'use strict';

var jsxRuntime = require('react/jsx-runtime');
var ui = require('@sanity/ui');
var React = require('react');
var reactIs = require('react-is');
var styled = require('styled-components');
var reactI18next = require('react-i18next');
function _interopDefaultCompat(e) {
  return e && typeof e === 'object' && 'default' in e ? e : {
    default: e
  };
}
var styled__default = /*#__PURE__*/_interopDefaultCompat(styled);
function ConditionalWrapper(_ref) {
  let {
    children,
    condition,
    wrapper
  } = _ref;
  if (!condition) {
    return children;
  }
  return wrapper(children);
}
var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", {
  value: __freeze$1(raw || cooked.slice())
}));
var _a$1;
const LARGE_BUTTON_PROPS = {
  space: 3,
  padding: 3
};
const DEFAULT_BUTTON_PROPS = {
  space: 2,
  padding: 2
};
const TooltipButtonWrapper = styled__default.default.span(_a$1 || (_a$1 = __template$1(["\n  display: inline-flex;\n"])));
const Button = React.forwardRef(function Button2(_ref2, ref) {
  let {
    size = "default",
    mode = "default",
    paddingY,
    tone = "default",
    tooltipProps,
    ...rest
  } = _ref2;
  const renderWrapper = React.useCallback(children => {
    return /* @__PURE__ */jsxRuntime.jsx(Tooltip, {
      content: tooltipProps == null ? void 0 : tooltipProps.content,
      portal: true,
      ...tooltipProps,
      children: /* @__PURE__ */jsxRuntime.jsx(TooltipButtonWrapper, {
        children
      })
    });
  }, [tooltipProps]);
  const sizeProps = size === "default" ? DEFAULT_BUTTON_PROPS : LARGE_BUTTON_PROPS;
  return /* @__PURE__ */jsxRuntime.jsx(ConditionalWrapper, {
    condition: !!tooltipProps,
    wrapper: renderWrapper,
    children: /* @__PURE__ */jsxRuntime.jsx(ui.Button, {
      ...rest,
      ...sizeProps,
      paddingY,
      ref,
      mode,
      tone
    })
  });
});
const Dialog = React.forwardRef(function Dialog2(_ref3, ref) {
  let {
    bodyHeight,
    children,
    footer,
    padding = true,
    ...props
  } = _ref3;
  const {
    t
  } = reactI18next.useTranslation();
  return /* @__PURE__ */jsxRuntime.jsx(ui.Dialog, {
    ...props,
    animate: true,
    ref,
    footer: ((footer == null ? void 0 : footer.confirmButton) || (footer == null ? void 0 : footer.cancelButton)) && /* @__PURE__ */jsxRuntime.jsxs(ui.Flex, {
      width: "full",
      gap: 3,
      justify: "flex-end",
      padding: 3,
      children: [props.onClose && /* @__PURE__ */jsxRuntime.jsx(ui.Button, {
        mode: "bleed",
        padding: 2,
        text: t("common.dialog.cancel-button.text"),
        tone: "default",
        onClick: props.onClose,
        ...footer.cancelButton
      }), footer.confirmButton && /* @__PURE__ */jsxRuntime.jsx(ui.Button, {
        mode: "default",
        padding: 2,
        text: t("common.dialog.confirm-button.text"),
        tone: "critical",
        ...footer.confirmButton
      })]
    }),
    children: /* @__PURE__ */jsxRuntime.jsx(ui.Box, {
      height: bodyHeight,
      padding: padding ? 4 : 0,
      children
    })
  });
});
const MenuButton = React.forwardRef(function MenuButton2(props, ref) {
  return /* @__PURE__ */jsxRuntime.jsx(ui.MenuButton, {
    ...props,
    ref,
    popover: {
      ...props.popover,
      animate: true
    }
  });
});
const MenuGroup = props => {
  return /* @__PURE__ */jsxRuntime.jsx(ui.MenuGroup, {
    ...props,
    fontSize: 1,
    padding: 3
  });
};
var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", {
  value: __freeze(raw || cooked.slice())
}));
var _a;
const FONT_SIZE = 1;
const PreviewWrapper = styled__default.default(ui.Box)(_a || (_a = __template(["\n  height: 25px;\n  width: 25px;\n  overflow: hidden;\n"])));
const MenuItem = React.forwardRef(function MenuItem2(_ref4, ref) {
  let {
    badgeText,
    children: childrenProp,
    disabled,
    hotkeys,
    icon,
    iconRight,
    preview = null,
    renderMenuItem,
    text,
    tooltipProps,
    ...rest
  } = _ref4;
  const menuItemContent = React.useMemo(() => {
    return /* @__PURE__ */jsxRuntime.jsxs(ui.Flex, {
      align: "center",
      gap: 2,
      children: [preview && /* @__PURE__ */jsxRuntime.jsx(PreviewWrapper, {
        style: {
          opacity: disabled ? 0.25 : void 0
        },
        children: /* @__PURE__ */jsxRuntime.jsx(ui.Flex, {
          align: "center",
          height: "fill",
          justify: "center",
          children: preview
        })
      }), icon && /* @__PURE__ */jsxRuntime.jsx(ui.Box, {
        paddingRight: 1,
        children: /* @__PURE__ */jsxRuntime.jsxs(ui.Text, {
          size: FONT_SIZE,
          children: [React.isValidElement(icon) && icon, reactIs.isValidElementType(icon) && React.createElement(icon)]
        })
      }), text && /* @__PURE__ */jsxRuntime.jsx(ui.Stack, {
        flex: 1,
        space: 2,
        children: /* @__PURE__ */jsxRuntime.jsx(ui.Text, {
          size: FONT_SIZE,
          textOverflow: "ellipsis",
          weight: "medium",
          children: text
        })
      }), (badgeText || hotkeys || iconRight) && /* @__PURE__ */jsxRuntime.jsxs(ui.Flex, {
        align: "center",
        gap: 3,
        marginLeft: 3,
        children: [hotkeys && /* @__PURE__ */jsxRuntime.jsx(ui.Hotkeys, {
          keys: hotkeys,
          style: {
            marginTop: -4,
            marginBottom: -4
          }
        }), badgeText && /* @__PURE__ */jsxRuntime.jsx(ui.Badge, {
          fontSize: 0,
          style: {
            marginTop: -4,
            marginBottom: -4
          },
          children: badgeText
        }), iconRight && /* @__PURE__ */jsxRuntime.jsxs(ui.Text, {
          size: FONT_SIZE,
          children: [React.isValidElement(iconRight) && iconRight, reactIs.isValidElementType(iconRight) && React.createElement(iconRight)]
        })]
      })]
    });
  }, [badgeText, disabled, hotkeys, icon, iconRight, preview, text]);
  const renderWrapper = React.useCallback(children => {
    return /* @__PURE__ */jsxRuntime.jsx(Tooltip, {
      content: tooltipProps == null ? void 0 : tooltipProps.content,
      portal: true,
      ...tooltipProps,
      children: /* @__PURE__ */jsxRuntime.jsx("div", {
        children
      })
    });
  }, [tooltipProps]);
  return /* @__PURE__ */jsxRuntime.jsx(ConditionalWrapper, {
    condition: !!tooltipProps,
    wrapper: renderWrapper,
    children: /* @__PURE__ */jsxRuntime.jsx(ui.MenuItem, {
      disabled,
      paddingLeft: preview ? 1 : 3,
      paddingRight: 3,
      paddingY: preview ? 1 : 3,
      ref,
      ...rest,
      children: typeof childrenProp === "undefined" && typeof renderMenuItem === "function" ? renderMenuItem(menuItemContent) : menuItemContent
    })
  });
});
const Popover = React.forwardRef(function Popover2(props, ref) {
  return /* @__PURE__ */jsxRuntime.jsx(ui.Popover, {
    ...props,
    animate: true,
    ref
  });
});
const SMALL_TAB_PROPS = {
  padding: 2
};
const DEFAULT_TAB_PROPS = {
  padding: 3
};
const Tab = React.forwardRef(function Tab2(_ref5, ref) {
  let {
    size = "small",
    tone = "default",
    ...props
  } = _ref5;
  return /* @__PURE__ */jsxRuntime.jsx(ui.Tab, {
    ...props,
    ...(size === "default" ? DEFAULT_TAB_PROPS : SMALL_TAB_PROPS),
    muted: true,
    ref,
    tone
  });
});
const TOOLTIP_DELAY_PROPS = {
  open: 400
};
const TOOLTIP_SHARED_PROPS = {
  animate: true,
  arrow: false,
  boundaryElement: null,
  delay: TOOLTIP_DELAY_PROPS,
  fallbackPlacements: ["bottom-start", "bottom-end", "top-start", "top-end"],
  placement: "bottom",
  portal: true
};
const Tooltip = React.forwardRef(function Tooltip2(props, ref) {
  const {
    content,
    hotkeys,
    ...rest
  } = props;
  if (typeof content === "string") {
    return /* @__PURE__ */jsxRuntime.jsx(ui.Tooltip, {
      ...TOOLTIP_SHARED_PROPS,
      content: /* @__PURE__ */jsxRuntime.jsxs(ui.Flex, {
        align: "center",
        children: [content && /* @__PURE__ */jsxRuntime.jsx(ui.Box, {
          flex: 1,
          padding: 1,
          children: /* @__PURE__ */jsxRuntime.jsx(ui.Text, {
            size: 1,
            children: content
          })
        }), hotkeys && /* @__PURE__ */jsxRuntime.jsx(ui.Box, {
          flex: "none",
          children: /* @__PURE__ */jsxRuntime.jsx(ui.Hotkeys, {
            keys: hotkeys
          })
        })]
      }),
      padding: 1,
      ref,
      ...rest
    });
  }
  return /* @__PURE__ */jsxRuntime.jsx(ui.Tooltip, {
    ...TOOLTIP_SHARED_PROPS,
    content,
    ref,
    ...rest
  });
});
exports.Button = Button;
exports.Dialog = Dialog;
exports.MenuButton = MenuButton;
exports.MenuGroup = MenuGroup;
exports.MenuItem = MenuItem;
exports.Popover = Popover;
exports.TOOLTIP_DELAY_PROPS = TOOLTIP_DELAY_PROPS;
exports.Tab = Tab;
exports.Tooltip = Tooltip;
//# sourceMappingURL=Tooltip-HN_as_Fj.js.map
