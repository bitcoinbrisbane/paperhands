import { useState, FormEvent } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result) {
      navigate("/dashboard");
    }
  };

  const handleRegister = async () => {
    const result = await register({ email, password });
    if (result) {
      navigate("/dashboard");
    }
  };

  return (
    <Card className="login-panel">
      <Card.Body>
        <Card.Title className="mb-4">Login</Card.Title>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Control
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Control
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mb-2"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Login"}
          </Button>

          <Button
            variant="outline-primary"
            className="w-100 mb-3"
            disabled={loading}
            onClick={handleRegister}
          >
            {loading ? <Spinner size="sm" /> : "Register"}
          </Button>
        </Form>

        <hr />

        <Button
          variant="outline-dark"
          className="w-100 mb-2"
          disabled={true}
        >
          Apple
        </Button>

        <Button
          variant="outline-secondary"
          className="w-100"
          disabled={true}
        >
          Passkey
        </Button>
      </Card.Body>
    </Card>
  );
}
