import { LoginPanel } from "./LoginPanel";
import heroImage from "../assets/ka-long-li-b_6pyAdesjE-unsplash.jpg";

export function LandingPage() {
  return (
    <div
      className="landing-page min-vh-100 position-relative"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="position-absolute top-0 start-0 p-4 p-md-5" style={{ zIndex: 2 }}>
        <LoginPanel />
      </div>
      <div
        className="position-absolute text-white"
        style={{
          bottom: "15%",
          right: "10%",
          zIndex: 2,
          textAlign: "right",
          textShadow: "2px 2px 8px rgba(0, 0, 0, 0.7)",
        }}
      >
        <h1 style={{ fontSize: "4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          ftx.finance
        </h1>
        <p style={{ fontSize: "1.5rem", fontWeight: 300 }}>
          Only for diamond hands.
        </p>
      </div>
      <div
        className="position-absolute text-white"
        style={{
          bottom: "1rem",
          right: "1rem",
          zIndex: 2,
          fontSize: "0.75rem",
          opacity: 0.7,
          textShadow: "1px 1px 4px rgba(0, 0, 0, 0.7)",
        }}
      >
        Cape Schanck VIC, Australia |{" "}
        <a
          href="https://unsplash.com/license"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white"
          style={{ textDecoration: "underline" }}
        >
          Unsplash License
        </a>
      </div>
    </div>
  );
}
