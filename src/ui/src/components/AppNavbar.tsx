import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">Paperhands</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/loans"
              active={location.pathname === "/loans"}
            >
              Loans
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/capital"
              active={location.pathname === "/capital"}
            >
              Capital
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/analytics"
              active={location.pathname === "/analytics"}
            >
              Analytics
            </Nav.Link>
            <NavDropdown
              title="Transactions"
              id="transactions-dropdown"
              active={location.pathname.startsWith("/transactions")}
            >
              <NavDropdown.Item
                as={Link}
                to="/transactions/bitcoin"
                active={location.pathname === "/transactions/bitcoin"}
              >
                Bitcoin
              </NavDropdown.Item>
              <NavDropdown.Item
                as={Link}
                to="/transactions/aud"
                active={location.pathname === "/transactions/aud"}
              >
                AUD
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav>
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
