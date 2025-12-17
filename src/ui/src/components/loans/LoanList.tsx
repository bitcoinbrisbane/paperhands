import { Card, Table, Badge, Button, Spinner } from "react-bootstrap";
import { Loan } from "../../types/loan";

interface LoanListProps {
  loans: Loan[];
  loading: boolean;
  onDepositClick?: (loan: Loan) => void;
}

export function LoanList({ loans, loading, onDepositClick }: LoanListProps) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatBtc = (amount: number) => {
    return amount.toFixed(8);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "warning",
      active: "success",
      inactive: "secondary",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="text-muted mt-3">Loading loans...</p>
        </Card.Body>
      </Card>
    );
  }

  if (loans.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <p className="text-muted">No loans found</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Amount</th>
              <th>Collateral</th>
              <th>BTC Price</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>
                  <code>#{loan.id}</code>
                </td>
                <td>
                  <strong>${formatCurrency(loan.amountAud)}</strong> AUD
                </td>
                <td>{formatBtc(loan.collateralBtc)} BTC</td>
                <td>${formatCurrency(loan.btcPriceAtCreation)}</td>
                <td>{getStatusBadge(loan.status)}</td>
                <td>{formatDate(loan.createdAt)}</td>
                <td>
                  {loan.status === "pending" && !loan.depositAddress && (
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => onDepositClick?.(loan)}
                    >
                      Deposit BTC
                    </Button>
                  )}
                  {loan.status === "pending" && loan.depositAddress && (
                    <span className="text-muted small">Awaiting deposit</span>
                  )}
                  {loan.status === "active" && (
                    <Button size="sm" variant="outline-primary">
                      View Details
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
