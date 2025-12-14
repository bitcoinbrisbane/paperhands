import { Card, Button } from "react-bootstrap";

export function LoanPromo() {
  return (
    <Card className="text-center mb-4">
      <Card.Body className="py-5">
        <div className="promo-icon mb-3">
          <span className="dollar-badge">$</span>
        </div>
        <h5>Access funds without selling your BTC</h5>
        <p className="text-muted mb-4">
          Get a loan in <a href="#">3 simple steps</a> without pre-payment penalties, and no
          interest payments until you close the loan. Most clients receive their
          funds within 12h of sending collateral.
        </p>
        <Button variant="outline-dark">
          <span className="me-2">▶</span>
          Watch how it works
        </Button>
      </Card.Body>
    </Card>
  );
}
