import { Button } from "react-bootstrap";

interface LoanHeaderProps {
  onApply: () => void;
}

export function LoanHeader({ onApply }: LoanHeaderProps) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div className="d-flex align-items-center">
        <div className="btc-icon me-3">
          <span className="bitcoin-badge">₿</span>
        </div>
        <h4 className="mb-0">BTC-backed loans</h4>
      </div>
      <Button variant="dark" onClick={onApply}>
        Apply for a loan
      </Button>
    </div>
  );
}
