import { Outlet } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";

export function PortalLayout() {
  return (
    <div className="portal-layout">
      <AppNavbar />
      <Outlet />
    </div>
  );
}
