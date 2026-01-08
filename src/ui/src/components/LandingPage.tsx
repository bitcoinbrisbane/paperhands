import { Container, Row, Col } from "react-bootstrap";
import { LoginPanel } from "./LoginPanel";
import { LandingPageCharts } from "./LandingPageCharts";

export function LandingPage() {
  return (
    <Container fluid className="landing-page">
      <Row className="min-vh-100">
        <Col md={4} lg={3} className="d-flex align-items-start pt-5 ps-4">
          <LoginPanel />
        </Col>
        <Col md={8} lg={9} className="py-5 px-4">
          <div className="mb-5">
            <h1>Paperhands</h1>
            <p className="text-muted">Bitcoin-backed lending platform analytics</p>
          </div>
          <LandingPageCharts />
        </Col>
      </Row>
    </Container>
  );
}
