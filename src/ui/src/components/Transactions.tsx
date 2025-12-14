import { Container, Card, Row, Col, Button } from "react-bootstrap";

export function Transactions() {
  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <div className="btc-icon me-3">
          <span className="bitcoin-badge">₿</span>
        </div>
        <h4 className="mb-0">BTC Transaction account</h4>
      </div>

      {/* Overview Card */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-4">Overview</h5>
          <Row className="mb-4">
            <Col md={6}>
              <div className="mb-3">
                <div className="text-muted mb-2">Balance</div>
                <div className="h3">0 BTC</div>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-3">
                <div className="text-muted mb-2">Interest rate</div>
                <div className="h3">0.00%</div>
              </div>
            </Col>
          </Row>
          <div className="d-flex gap-3">
            <Button variant="dark">
              <span className="me-2">↘</span>
              Deposit
            </Button>
            <Button variant="outline-dark">
              <span className="me-2">↗</span>
              Withdraw
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Activity Card */}
      <Card>
        <Card.Body>
          <h5 className="mb-4">Activity</h5>
          <div className="text-center py-5">
            <div className="mb-3">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="#C8E6C9" opacity="0.3"/>
                <g transform="translate(30, 30)">
                  <rect x="0" y="5" width="20" height="3" rx="1.5" fill="#2E7D32"/>
                  <rect x="0" y="12" width="20" height="3" rx="1.5" fill="#2E7D32"/>
                  <rect x="0" y="19" width="20" height="3" rx="1.5" fill="#2E7D32"/>
                </g>
              </svg>
            </div>
            <p className="text-muted">Your transactions will appear here.</p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
