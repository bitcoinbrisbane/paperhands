import { Container, Card } from "react-bootstrap";

export function Dashboard() {
  return (
    <Container className="py-4">
      <h2>Dashboard</h2>
      <Card>
        <Card.Body>
          <Card.Text>Welcome! You are logged in.</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}
