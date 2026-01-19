import { Container } from "react-bootstrap";
import { LandingPageCharts } from "./LandingPageCharts";

export function Dashboard() {
  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2>Dashboard</h2>
        <p className="text-muted">Bitcoin-backed lending platform overview</p>
      </div>
      <LandingPageCharts />
    </Container>
  );
}
