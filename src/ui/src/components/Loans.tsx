import { Container, Card } from "react-bootstrap";

export function Loans() {
  return (
    <Container className="py-4">
      <h2>Loans</h2>
      <Card>
        <Card.Body>
          <Card.Text className="text-muted">No loans found.</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}
