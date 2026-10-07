import "./Header.css";
import { useLocation } from "react-router-dom";

const Header = () => {
  const { pathname } = useLocation();
  const pageName = pathname === "/"
    ? "INTRO"
    : pathname.split("/").filter(Boolean).at(-1)?.toUpperCase() ?? "INTRO";

  return (
    <div className="header">
      <div className="logo">SKINSTRIC</div>
      <div className="page-name">[ {pageName} ]</div>
      <button className="code">ENTER CODE</button>
    </div>
  );
};

export default Header;