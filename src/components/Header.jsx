import "./Header.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const Header = () => {
  const { pathname } = useLocation();
  const pageName = pathname === "/"
    ? "INTRO"
    : pathname.split("/").filter(Boolean).at(-1)?.toUpperCase() ?? "INTRO";

  return (
    <div className="header">
      <Link className="logo" to="/" aria-label="Skinstric home">
        SKINSTRIC
      </Link>
      <div className="page-name">[ {pageName} ]</div>
      <button className="code">ENTER CODE</button>
    </div>
  );
};

export default Header;