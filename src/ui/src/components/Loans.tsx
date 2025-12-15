import { useState } from "react";
import { Container, Card, Nav, Button, Form, Row, Col, InputGroup, Modal, Spinner } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../services/api";
import { useBtcPrice } from "../hooks/useBtcPrice";

type LoanStatus = "active" | "pending" | "inactive";
const LTV_RATIO = 0.5; // 50% loan-to-value

export function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>("active");
  const [loanAmount, setLoanAmount] = useState(500);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { price: btcPrice, loading: priceLoading } = useBtcPrice();

  const collateral = btcPrice ? (loanAmount / LTV_RATIO) / btcPrice : 0;

  const handleDeposit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/bitcoin/address", {
        customerId: 1,
        loanId: 0,
      });
      setDepositAddress(response.data.address);
      setShowDepositModal(true);
    } catch (err) {
      setError("Failed to generate deposit address");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              <Button
                variant="warning"
                className="w-100 mt-2"
                onClick={handleDeposit}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Deposit BTC"}
              </Button>
              {error && <div className="text-danger mt-2">{error}</div>}
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <div className="mb-3">
                  <div className="text-muted small">Loan amount</div>
                  <div className="h4">{loanAmount.toFixed(2)} AUD</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted small">Collateral</div>
                  <div className="h4">
                    {priceLoading ? <Spinner size="sm" /> : `${collateral.toFixed(8)} BTC`}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted small">Finance charge</div>
                  <div className="h4">11.90% APR</div>
                </div>
                <div>
                  <div className="text-muted small">BTC/AUD Rate</div>
                  <div className="h5">
                    {priceLoading ? <Spinner size="sm" /> : `$${btcPrice?.toLocaleString()} AUD`}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Deposit Modal */}
      <Modal show={showDepositModal} onHide={() => setShowDepositModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Deposit BTC</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="text-muted mb-3">
            Send {collateral.toFixed(8)} BTC to the following address:
          </p>
          {depositAddress && (
            <div className="mb-3">
              <QRCodeSVG
                value={`bitcoin:${depositAddress}?amount=${collateral.toFixed(8)}`}
                size={200}
                level="M"
              />
            </div>
          )}
          <div className="bg-light p-3 rounded">
            <code className="text-break" style={{ fontSize: "0.85rem" }}>
              {depositAddress}
            </code>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDepositModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
