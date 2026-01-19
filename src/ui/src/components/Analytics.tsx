import { Container } from "react-bootstrap";
import { LandingPageCharts } from "./LandingPageCharts";

export function Analytics() {
  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h1>Analytics</h1>
        <p className="text-muted">Bitcoin-backed lending platform analytics</p>
      </div>
      <LandingPageCharts />
    </Container>
  );
}
