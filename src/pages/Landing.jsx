import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={styles.container}>
      <h1>Reuben AI</h1>

      <p style={styles.subtitle}>
        Turn any skill into a step-by-step AI roadmap in seconds.
      </p>

      <Link to="/app" style={styles.button}>
        Get Started
      </Link>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: 80,
    fontFamily: "Arial",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 30,
  },
  button: {
    padding: "12px 20px",
    background: "black",
    color: "white",
    textDecoration: "none",
    display: "inline-block",
    borderRadius: 6,
  },
};