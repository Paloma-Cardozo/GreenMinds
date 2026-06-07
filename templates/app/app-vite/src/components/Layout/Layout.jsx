import { Outlet, Link } from "react-router-dom";
import hyfLogo from "../../assets/hyf.svg";

function Layout() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <a
          href="https://www.hackyourfuture.dk/"
          target="_blank"
          className="logo-link"
        >
          <img src={hyfLogo} alt="HackYourFuture logo" className="logo" />
        </a>
        <Link to="/nested" className="nav-link">
          Nested page
        </Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
