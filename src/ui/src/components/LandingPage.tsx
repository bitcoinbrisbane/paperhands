import { Container, Row, Col } from "react-bootstrap";
import { LoginPanel } from "./LoginPanel";

export function LandingPage() {
  return (
    <Container fluid className="landing-page">
      <Row className="min-vh-100">
        <Col md={4} lg={3} className="d-flex align-items-start pt-5 ps-4">
          <LoginPanel />
        </Col>
        <Col md={8} lg={9} className="d-flex align-items-center justify-content-center">
          <div className="text-center">
            <h1>Paperhands</h1>
            <p className="text-muted">Welcome to Paperhands</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
