import { useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup, Spinner, Alert } from "react-bootstrap";
import { useBtcPrice } from "../../hooks/useBtcPrice";
import api2 from "../../services/api2";

const LTV_RATIO = 0.5;
const MIN_TERM_DAYS = 30;
const MAX_TERM_DAYS = 1825; // 5 years

interface LoanApplicationModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

export function LoanApplicationModal({ show, onHide, onSuccess }: LoanApplicationModalProps) {
  const [loanAmount, setLoanAmount] = useState(5000);
  const [termDays, setTermDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { price: btcPrice, loading: priceLoading } = useBtcPrice();

  const collateralBtc = btcPrice ? (loanAmount / LTV_RATIO) / btcPrice : 0;

  const formatTermLabel = (days: number): string => {
    if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    const years = (days / 365).toFixed(1);
    return `${years} year${years !== '1.0' ? 's' : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!btcPrice) {
        throw new Error("BTC price not available");
      }

      const response = await api2.post("/loans", {
        customerId: 1, // TODO: Get from auth context
        amountAud: loanAmount,
        collateralBtc: collateralBtc,
        btcPriceAtCreation: btcPrice,
      });

      console.log("Loan application created:", response.data);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onHide();
        setSuccess(false);
        setLoanAmount(5000);
        setTermDays(365);
      }, 2000);
    } catch (err) {
      console.error("Error creating loan application:", err);
      setError("Failed to submit loan application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Apply for a BTC-backed Loan</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Loan application submitted successfully!</Alert>}

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
                  Based on 50% loan-to-value ratio
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
                  <div className="text-muted small">Loan Term</div>
                  <div className="h5 mb-0">{formatTermLabel(termDays)}</div>
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
                    {priceLoading ? <Spinner size="sm" /> : `$${btcPrice?.toLocaleString()} AUD`}
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
