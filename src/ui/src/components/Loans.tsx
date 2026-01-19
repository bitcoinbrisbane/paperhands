import { useState, useEffect } from "react";
import { Container, Card, Nav, Button, Form, Row, Col, InputGroup, Modal, Spinner } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../services/api";
import api2 from "../services/api2";
import { useBtcPrice } from "../hooks/useBtcPrice";
import { LoanApplicationModal } from "./loans/LoanApplicationModal";
import { LoanList } from "./loans/LoanList";
import { Loan } from "../types/loan";

type LoanStatus = "active" | "pending" | "inactive";
const LTV_RATIO = 0.5; // 50% loan-to-value

export function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>("pending");
  const [loanAmount, setLoanAmount] = useState(500);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loansLoading, setLoansLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { price: btcPrice, loading: priceLoading } = useBtcPrice();

  const collateral = btcPrice ? (loanAmount / LTV_RATIO) / btcPrice : 0;

  useEffect(() => {
    fetchLoans();
  }, [activeTab]);

  const fetchLoans = async () => {
    setLoansLoading(true);
    try {
      const response = await api2.get(`/loans?customerId=1&status=${activeTab}`);
      setLoans(response.data);
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      setLoansLoading(false);
    }
  };

  const handleDeposit = async (loan: Loan) => {
    setLoading(true);
    setError(null);
    setSelectedLoan(loan);
    try {
      const response = await api.post("/bitcoin/address", {
        customerId: loan.customerId,
        loanId: loan.id,
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
        <Button variant="dark" onClick={() => setShowApplicationModal(true)}>Apply for a loan</Button>
      </div>

      {/* Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
            Pending
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "active"} onClick={() => setActiveTab("active")}>
            Active
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "inactive"} onClick={() => setActiveTab("inactive")}>
            Inactive
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Loans List */}
      <div className="mb-4">
        <LoanList loans={loans} loading={loansLoading} onDepositClick={handleDeposit} />
      </div>

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
                onClick={() => setShowApplicationModal(true)}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Apply for Loan"}
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

      {/* Loan Application Modal */}
      <LoanApplicationModal
        show={showApplicationModal}
        onHide={() => setShowApplicationModal(false)}
        onSuccess={() => {
          console.log("Loan application submitted successfully");
          setActiveTab("pending");
          fetchLoans();
        }}
      />

      {/* Deposit Modal */}
      <Modal show={showDepositModal} onHide={() => setShowDepositModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Deposit BTC</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedLoan && (
            <>
              <div className="mb-3">
                <h6>Loan #{selectedLoan.id}</h6>
                <p className="text-muted mb-0">
                  Amount: ${selectedLoan.amountAud.toLocaleString()} AUD
                </p>
              </div>
              <p className="text-muted mb-3">
                Send {selectedLoan.collateralBtc.toFixed(8)} BTC to the following address:
              </p>
            </>
          )}
          {depositAddress && selectedLoan && (
            <div className="mb-3">
              <QRCodeSVG
                value={`bitcoin:${depositAddress}?amount=${selectedLoan.collateralBtc.toFixed(8)}`}
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
          <div className="alert alert-info mt-3 mb-0 text-start">
            <small>
              <strong>Note:</strong> Once you deposit the BTC, your loan will be processed and funds will be transferred to your account.
            </small>
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
