import { type JSX, useState } from "react";

import { useAuth } from "../../features/auth/AuthContext";
import UserMenuTrigger from "./UserMenuTrigger";
import UserMenuDropdown from "./UserMenuDropdown";

export interface UserMenuProps {
  onLogout?: () => Promise<void> | void;
}

export default function UserMenu({ onLogout }: UserMenuProps): JSX.Element {
  const { user } = useAuth();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <UserMenuTrigger user={user} onClick={openMenu} />

      <UserMenuDropdown
        user={user}
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        onLogout={onLogout}
      />
    </>
  );
}
