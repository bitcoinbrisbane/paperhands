import { Container, Card } from "react-bootstrap";

export function Transactions() {
  return (
    <Container className="py-4">
      <h2>Transactions</h2>
      <Card>
        <Card.Body>
          <Card.Text className="text-muted">No transactions found.</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}
