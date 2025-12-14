import { useState } from "react";
import { Container, Card, Nav, Button, Form, Row, Col, InputGroup } from "react-bootstrap";

type LoanStatus = "active" | "pending" | "inactive";

export function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>("active");
  const [loanAmount, setLoanAmount] = useState(500);

  const collateral = (loanAmount / 0.5) / 45000;

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="btc-icon me-3">
            <span className="bitcoin-badge">₿</span>
          </div>
          <h4 className="mb-0">BTC-backed loans</h4>
        </div>
        <Button variant="dark">Apply for a loan</Button>
      </div>

      {/* Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link active={activeTab === "active"} onClick={() => setActiveTab("active")}>
            Active
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
            Pending
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "inactive"} onClick={() => setActiveTab("inactive")}>
            Inactive
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Promo */}
      <Card className="text-center mb-4">
        <Card.Body className="py-5">
          <div className="promo-icon mb-3">
            <span className="dollar-badge">$</span>
          </div>
          <h5>Access funds without selling your BTC</h5>
          <p className="text-muted mb-4">
            Get a loan in 3 simple steps without pre-payment penalties, and no
            interest payments until you close the loan.
          </p>
          <Button variant="outline-dark">Watch how it works</Button>
        </Card.Body>
      </Card>

      {/* Calculator */}
      <Card>
        <Card.Body>
          <h5 className="mb-3">Loan calculator</h5>
          <p className="text-muted mb-4">
            BTC-backed loans have a 12-month term and are denominated in Australian dollars.
          </p>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Loan amount</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                  />
                  <InputGroup.Text>AUD</InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Collateral</Form.Label>
                <InputGroup>
                  <Form.Control type="text" value={collateral.toFixed(8)} readOnly />
                  <InputGroup.Text>BTC</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <div className="mb-3">
                  <div className="text-muted small">Loan amount</div>
                  <div className="h4">{loanAmount.toFixed(2)} AUD</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted small">Collateral</div>
                  <div className="h4">{collateral.toFixed(8)} BTC</div>
                </div>
                <div>
                  <div className="text-muted small">Finance charge</div>
                  <div className="h4">11.90% APR</div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
