import { useState } from "react";
import { Container } from "react-bootstrap";
import {
  LoanHeader,
  LoanTabs,
  LoanPromo,
  LoanCalculator,
  LoanStatus,
} from "./loans";

export function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>("active");

  const handleApply = () => {
    // TODO: Implement apply for loan
    console.log("Apply for loan clicked");
  };

  return (
    <Container className="py-4">
      <LoanHeader onApply={handleApply} />
      <LoanTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <LoanPromo />
      <LoanCalculator />
    </Container>
  );
}
