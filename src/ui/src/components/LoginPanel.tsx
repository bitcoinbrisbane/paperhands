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
          variant="dark"
          className="w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
          disabled={true}
          style={{ backgroundColor: "#000", borderColor: "#000" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Sign in with Apple
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
