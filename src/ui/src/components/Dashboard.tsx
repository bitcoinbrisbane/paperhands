import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Container className="py-5">
      <Card>
        <Card.Body>
          <Card.Title>Dashboard</Card.Title>
          <Card.Text>Welcome! You are logged in.</Card.Text>
          <Button variant="outline-danger" onClick={handleLogout}>
            Logout
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}
