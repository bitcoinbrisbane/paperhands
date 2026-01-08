import { useState, useEffect } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

interface LVRData {
  lvr: string;
  count: number;
  amount: number;
}

interface CapitalUtilizationData {
  month: string;
  supplied: number;
  utilized: number;
}

interface InterestEarnedData {
  month: string;
  interest: number;
}

interface SummaryData {
  totalLoans: number;
  totalLoanValue: number;
  totalCapitalSupplied: number;
  utilizationRate: number;
  totalInterestEarned: number;
  averageLVR: number;
}

export function LandingPageCharts() {
  const [lvrData, setLvrData] = useState<LVRData[]>([]);
  const [capitalData, setCapitalData] = useState<CapitalUtilizationData[]>([]);
  const [interestData, setInterestData] = useState<InterestEarnedData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const [lvrRes, capitalRes, interestRes, summaryRes] = await Promise.all([
        api.get<LVRData[]>("/analytics/loans-lvr"),
        api.get<CapitalUtilizationData[]>("/analytics/capital-utilization"),
        api.get<InterestEarnedData[]>("/analytics/interest-earned"),
        api.get<SummaryData>("/analytics/summary"),
      ]);

      setLvrData(lvrRes.data);
      setCapitalData(capitalRes.data);
      setInterestData(interestRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="text-muted mt-3">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <div className="text-muted small mb-1">Total Loans</div>
                <h3 className="mb-0">{summary.totalLoans}</h3>
                <div className="text-muted small mt-2">
                  ${(summary.totalLoanValue / 1000000).toFixed(2)}M AUD
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <div className="text-muted small mb-1">Capital Utilization</div>
                <h3 className="mb-0">{summary.utilizationRate.toFixed(1)}%</h3>
                <div className="text-muted small mt-2">
                  ${(summary.totalCapitalSupplied / 1000000).toFixed(2)}M supplied
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="h-100">
              <Card.Body>
                <div className="text-muted small mb-1">Total Interest Earned</div>
                <h3 className="mb-0">${(summary.totalInterestEarned / 1000).toFixed(1)}k</h3>
                <div className="text-muted small mt-2">
                  Avg LVR: {summary.averageLVR.toFixed(1)}%
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Loans by LVR</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lvrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lvr" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Loan Count" />
                  <Bar dataKey="amount" fill="#82ca9d" name="Amount (AUD)" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Capital Supplied & Utilization</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={capitalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="supplied"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Capital Supplied"
                  />
                  <Area
                    type="monotone"
                    dataKey="utilized"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Capital Utilized"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={12} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Interest Earned Over Time</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={interestData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="interest"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="Interest Earned (AUD)"
                    dot={{ fill: "#ffc658" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
