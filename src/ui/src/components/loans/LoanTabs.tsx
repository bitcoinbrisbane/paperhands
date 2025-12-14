import { Nav } from "react-bootstrap";

export type LoanStatus = "active" | "pending" | "inactive";

interface LoanTabsProps {
  activeTab: LoanStatus;
  onTabChange: (tab: LoanStatus) => void;
}

export function LoanTabs({ activeTab, onTabChange }: LoanTabsProps) {
  return (
    <Nav variant="tabs" className="mb-4">
      <Nav.Item>
        <Nav.Link
          active={activeTab === "active"}
          onClick={() => onTabChange("active")}
        >
          Active
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          active={activeTab === "pending"}
          onClick={() => onTabChange("pending")}
        >
          Pending
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          active={activeTab === "inactive"}
          onClick={() => onTabChange("inactive")}
        >
          Inactive
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}
