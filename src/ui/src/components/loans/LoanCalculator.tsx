import { useState, useEffect } from "react";
import { Card, Form, Row, Col, InputGroup, Spinner } from "react-bootstrap";
import { useBtcPrice } from "../../hooks/useBtcPrice";

const LTV_RATIO = 0.5; // 50% loan-to-value
const ANNUAL_INTEREST_RATE = 0.099; // 9.90%
const ADMIN_FEE_RATE = 0.02; // 2.00%
const MIN_ADMIN_FEE = 25;

export function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(500);
  const [fundedIn, setFundedIn] = useState("AUD");

  const [collateral, setCollateral] = useState(0);
  const [apr, setApr] = useState(0);

  const { price: btcPrice, loading: priceLoading } = useBtcPrice();

  useEffect(() => {
    // Calculate required collateral
    if (btcPrice) {
      const collateralAud = loanAmount / LTV_RATIO;
      const collateralBtc = collateralAud / btcPrice;
      setCollateral(collateralBtc);
    }

    // Calculate APR (interest + admin fee)
    const totalRate = (ANNUAL_INTEREST_RATE + ADMIN_FEE_RATE) * 100;
    setApr(totalRate);
  }, [loanAmount, btcPrice]);

  const formatBtc = (value: number) => {
    return value.toFixed(8);
  };

  const formatAud = (value: number) => {
    return value.toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
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
                  min={100}
                />
                <InputGroup.Text>AUD</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Funded in</Form.Label>
              <Form.Select
                value={fundedIn}
                onChange={(e) => setFundedIn(e.target.value)}
              >
                <option value="AUD">AUD</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Collateral</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  value={formatBtc(collateral)}
                  readOnly
                />
                <InputGroup.Text>BTC ₿</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <div className="alert alert-light border mt-4">
              <small>
                <strong>Security first, always.</strong> Your collateral is held securely in custody
                with trusted partners — never lent out to earn interest. We don't take risks
                with your assets just to offer a lower rate.
              </small>
            </div>
          </Col>

          <Col md={6}>
            <div className="calculator-results p-3 bg-light rounded">
              <div className="mb-4">
                <div className="text-muted small">Loan amount</div>
                <div className="h4 mb-0">{formatAud(loanAmount)} AUD</div>
                <div className="text-muted small">Funded in {fundedIn}.</div>
              </div>

              <div className="mb-4">
                <div className="text-muted small">Collateral</div>
                <div className="h4 mb-0">
                  {priceLoading ? <Spinner size="sm" /> : `${formatBtc(collateral)} BTC`}
                </div>
                <div className="text-muted small">Amount required once your loan is approved.</div>
              </div>

              <div className="mb-4">
                <div className="text-muted small">Finance charge</div>
                <div className="h4 mb-0">{apr.toFixed(2)}% APR</div>
                <div className="text-muted small">
                  {(ANNUAL_INTEREST_RATE * 100).toFixed(2)}% annual interest rate + {(ADMIN_FEE_RATE * 100).toFixed(2)}% administration fee.
                  Minimum administration fee is {MIN_ADMIN_FEE} AUD.
                </div>
              </div>

              <div>
                <div className="text-muted small">BTC/AUD Rate</div>
                <div className="h5 mb-0">
                  {priceLoading ? <Spinner size="sm" /> : btcPrice ? `$${btcPrice.toLocaleString()} AUD` : 'Price unavailable'}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
