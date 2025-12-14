import { useState, FormEvent } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginWithApple, loginWithPasskey, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result) {
      navigate("/dashboard");
    }
  };

  const handleAppleLogin = async () => {
    const result = await loginWithApple();
    if (result) {
      navigate("/dashboard");
    }
  };

  const handlePasskeyLogin = async () => {
    const result = await loginWithPasskey();
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
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Login"}
          </Button>
        </Form>

        <hr />

        <Button
          variant="outline-dark"
          className="w-100 mb-2"
          onClick={handleAppleLogin}
          disabled={loading}
        >
          Apple
        </Button>

        <Button
          variant="outline-secondary"
          className="w-100"
          onClick={handlePasskeyLogin}
          disabled={loading}
        >
          Passkit
        </Button>
      </Card.Body>
    </Card>
  );
}
