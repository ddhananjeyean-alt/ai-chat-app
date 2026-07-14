import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export const WHEEL_RADIUS = 220;
export const INNER_RADIUS = 160;
export const ROTATION_LIMIT = 65;
export const DRAG_SENSITIVITY = 0.15;
export const SCROLL_SENSITIVITY = 5;

export const COLORS = {
  active: "var(--active)",
  text: "var(--text)",
  subText: "var(--subtext)",
  selected: "var(--selected)",
  hover: "var(--hover)",
  border: "var(--border)",
  ring1: "var(--ring1)",
  ring2: "var(--ring2)",
};

export const SHADOWS = {
  wheel: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
};

export const MENU_ITEMS = [
  {
    id: "new_chat",
    label: "New Chat",
    short: "Create",
    angle: -65,
    icon: AutoAwesomeOutlinedIcon,
  },
  {
    id: "search",
    label: "Search Chat",
    short: "Find",
    angle: -39,
    icon: SearchOutlinedIcon,
  },
  {
    id: "recent",
    label: "Recent Chats",
    short: "History",
    angle: -13,
    icon: HistoryOutlinedIcon,
  },
  {
    id: "archived",
    label: "Archived Chats",
    short: "Archive",
    angle: 13,
    icon: ArchiveOutlinedIcon,
  },
  {
    id: "shared",
    label: "Shared Chats",
    short: "Shared",
    angle: 39,
    icon: ShareOutlinedIcon,
  },
  {
    id: "settings",
    label: "Settings",
    short: "Options",
    angle: 65,
    icon: SettingsOutlinedIcon,
  },
];
