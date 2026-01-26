import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Row, Col, InputGroup, Spinner, Alert } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import { useBtcPrice } from "../../hooks/useBtcPrice";
import { useUserId } from "../../hooks/useUserId";
import api2 from "../../services/api2";

const MIN_TERM_DAYS = 30;
const MAX_TERM_DAYS = 1825; // 5 years
const DEPOSIT_TIMEOUT_SECONDS = 15 * 60; // 15 minutes
const MIN_LVR = 40;
const MAX_LVR = 80;
const DEFAULT_LVR = 50;

interface LoanApplicationModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

export function LoanApplicationModal({ show, onHide, onSuccess }: LoanApplicationModalProps) {
  const userId = useUserId();
  const [loanAmount, setLoanAmount] = useState(5000);
  const [termDays, setTermDays] = useState(365);
  const [lvr, setLvr] = useState(DEFAULT_LVR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two-step flow state
  const [step, setStep] = useState<'form' | 'deposit'>('form');
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(DEPOSIT_TIMEOUT_SECONDS);

  const { price: btcPrice, loading: priceLoading } = useBtcPrice();

  const collateralBtc = btcPrice ? (loanAmount / (lvr / 100)) / btcPrice : 0;

  const formatTermLabel = (days: number): string => {
    if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    const years = (days / 365).toFixed(1);
    return `${years} year${years !== '1.0' ? 's' : ''}`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      setStep('form');
      setDepositAddress(null);
      setTimeRemaining(DEPOSIT_TIMEOUT_SECONDS);
      setError(null);
      setLoanAmount(5000);
      setTermDays(365);
      setLvr(DEFAULT_LVR);
      onHide();
    }
  }, [loading, onHide]);

  // Countdown timer effect - auto-close when expired
  useEffect(() => {
    if (step !== 'deposit') return;

    if (timeRemaining <= 0) {
      onSuccess?.();
      handleClose();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeRemaining, handleClose, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!btcPrice) {
        throw new Error("BTC price not available");
      }

      // Step 1: Create loan via Go API
      const loanResponse = await api2.post("/loans", {
        customerId: userId,
        amountAud: loanAmount,
        collateralBtc: collateralBtc,
        btcPriceAtCreation: btcPrice,
      });

      const newLoanId = loanResponse.data.id;
      console.log("Loan application created:", loanResponse.data);

      // Step 2: Generate BTC address via Go API
      const addressResponse = await api2.post("/bitcoin/address", {
        customerId: userId,
        loanId: newLoanId,
      });

      setDepositAddress(addressResponse.data.address);
      setStep('deposit');
      setTimeRemaining(DEPOSIT_TIMEOUT_SECONDS);
    } catch (err) {
      console.error("Error creating loan application:", err);
      setError("Failed to submit loan application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render deposit step
  if (step === 'deposit') {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Deposit Collateral</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {/* Timer */}
          <div className={`mb-3 ${timeRemaining < 120 ? 'text-danger' : 'text-muted'}`}>
            <strong>Time remaining: {formatTime(timeRemaining)}</strong>
          </div>

          {/* QR Code */}
          {depositAddress && (
            <div className="mb-3">
              <QRCodeSVG
                value={`bitcoin:${depositAddress}?amount=${collateralBtc.toFixed(8)}`}
                size={200}
                level="M"
              />
            </div>
          )}

          {/* Amount */}
          <div className="mb-3">
            <div className="text-muted small">Amount to send</div>
            <div className="h4">{collateralBtc.toFixed(8)} BTC</div>
          </div>

          {/* Address */}
          <div className="bg-light p-3 rounded mb-3">
            <code className="text-break" style={{ fontSize: "0.85rem" }}>
              {depositAddress}
            </code>
          </div>

          {/* Warning */}
          <Alert variant="warning" className="text-start">
            <small>
              <strong>Important:</strong> Only send BTC on the Bitcoin network to this address.
              Sending other assets or using a different network will result in permanent loss of funds.
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Render form step
  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Apply for a BTC-backed Loan</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="mb-4">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Loan Amount (AUD)</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    min={100}
                    max={1000000}
                    step={100}
                    required
                    disabled={loading}
                  />
                  <InputGroup.Text>AUD</InputGroup.Text>
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Loan Term: <strong>{formatTermLabel(termDays)}</strong> ({termDays} days)
                </Form.Label>
                <Form.Range
                  value={termDays}
                  onChange={(e) => setTermDays(Number(e.target.value))}
                  min={MIN_TERM_DAYS}
                  max={MAX_TERM_DAYS}
                  step={30}
                  disabled={loading}
                />
                <div className="d-flex justify-content-between text-muted small">
                  <span>30 days</span>
                  <span>5 years</span>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  LVR (Loan-to-Value Ratio): <strong>{lvr}%</strong>
                </Form.Label>
                <Form.Range
                  value={lvr}
                  onChange={(e) => setLvr(Number(e.target.value))}
                  min={MIN_LVR}
                  max={MAX_LVR}
                  step={5}
                  disabled={loading}
                />
                <div className="d-flex justify-content-between text-muted small">
                  <span>{MIN_LVR}%</span>
                  <span>{MAX_LVR}%</span>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Available Collateral (BTC)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value="12.45678901"
                    readOnly
                    className="bg-light"
                  />
                  <InputGroup.Text>BTC</InputGroup.Text>
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Required Collateral (BTC)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={collateralBtc.toFixed(8)}
                    readOnly
                  />
                  <InputGroup.Text>BTC</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Based on {lvr}% loan-to-value ratio
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <div className="p-4 bg-light rounded h-100">
                <h6 className="mb-3">Loan Summary</h6>

                <div className="mb-3">
                  <div className="text-muted small">Loan Amount</div>
                  <div className="h5 mb-0">${loanAmount.toLocaleString()} AUD</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Interest Rate</div>
                  <div className="h5 mb-0">11.90% APR</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Loan Term</div>
                  <div className="h5 mb-0">{formatTermLabel(termDays)}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">LVR</div>
                  <div className="h5 mb-0">{lvr}%</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">Required Collateral</div>
                  <div className="h5 mb-0">
                    {priceLoading ? <Spinner size="sm" /> : `${collateralBtc.toFixed(8)} BTC`}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small">BTC Price</div>
                  <div className="h6 mb-0">
                    {priceLoading ? <Spinner size="sm" /> : btcPrice ? `$${btcPrice.toLocaleString()} AUD` : 'Price unavailable'}
                  </div>
                </div>

                <hr />

                <div className="small text-muted">
                  <strong>Next steps:</strong>
                  <ol className="ps-3 mb-0 mt-2">
                    <li>Submit your application</li>
                    <li>Deposit {collateralBtc.toFixed(8)} BTC to the provided address</li>
                    <li>Receive funds in your account</li>
                  </ol>
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="warning" type="submit" disabled={loading || priceLoading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
