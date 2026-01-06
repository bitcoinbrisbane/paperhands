import { useState, useEffect, useCallback } from "react";
import { Container, Card, Row, Col, Button, Modal, Spinner, Table, Badge } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../services/api";

interface Transaction {
  txid: string;
  type: "receive" | "send";
  amount: number;
  amountAud: number;
  fee: number;
  feeAud: number;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  timestamp: string | null;
}

interface AddressBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
  confirmedAud: number;
  unconfirmedAud: number;
  totalAud: number;
}

export function TransactionsAUD() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [balance, setBalance] = useState<AddressBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchAddressData = useCallback(async (_address: string) => {
    setTxLoading(true);
    setTxError(null);
    try {
      // TODO: Implement Ethereum blockchain data fetching
      // For now, using mock data
      setBalance({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
        confirmedAud: 0,
        unconfirmedAud: 0,
        totalAud: 0,
      });
      setTransactions([]);
    } catch (err) {
      console.error("Failed to fetch blockchain data:", err);
      setTxError("Failed to fetch blockchain data");
    } finally {
      setTxLoading(false);
    }
  }, []);

  const handleDeposit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/ethereum/address", {
        customerId: 1,
        accountType: "aud",
      });
      setDepositAddress(response.data.address);
      setShowDepositModal(true);
    } catch (err) {
      setError("Failed to generate deposit address");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch address and blockchain data on mount
  useEffect(() => {
    const init = async () => {
      try {
        const response = await api.post("/ethereum/address", {
          customerId: 1,
          accountType: "aud",
        });
        const address = response.data.address;
        setDepositAddress(address);
        await fetchAddressData(address);
      } catch (err) {
        console.error("Failed to initialize:", err);
      }
    };
    init();
  }, [fetchAddressData]);

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return "Pending";
    return new Date(timestamp).toLocaleString();
  };

  const truncateTxid = (txid: string) => {
    return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
  };


  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <div className="btc-icon me-3" style={{ backgroundColor: '#627EEA' }}>
          <span className="bitcoin-badge" style={{ fontSize: '24px' }}>Ξ</span>
        </div>
        <h4 className="mb-0">AUD Transaction account</h4>
      </div>

      {/* Overview Card */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-4">Overview</h5>
          <Row className="mb-4">
            <Col md={4}>
              <div className="mb-3">
                <div className="text-muted mb-2">Confirmed Balance</div>
                <div className="h3">
                  {txLoading ? <Spinner size="sm" /> : `$${balance?.confirmedAud.toFixed(2) ?? "0.00"} AUD`}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="mb-3">
                <div className="text-muted mb-2">Unconfirmed</div>
                <div className="h3">
                  {txLoading ? <Spinner size="sm" /> : `$${balance?.unconfirmedAud.toFixed(2) ?? "0.00"} AUD`}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="mb-3">
                <div className="text-muted mb-2">Interest rate</div>
                <div className="h3">0.00%</div>
              </div>
            </Col>
          </Row>
          <div className="d-flex gap-3">
            <Button variant="warning" onClick={handleDeposit} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <><span className="me-2">↘</span>Deposit AUD</>}
            </Button>
            <Button variant="outline-dark">
              <span className="me-2">↗</span>
              Withdraw
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => depositAddress && fetchAddressData(depositAddress)}
              disabled={txLoading || !depositAddress}
            >
              {txLoading ? <Spinner size="sm" /> : "Refresh"}
            </Button>
          </div>
          {error && <div className="text-danger mt-2">{error}</div>}
        </Card.Body>
      </Card>

      {/* Activity Card */}
      <Card>
        <Card.Body>
          <h5 className="mb-4">Activity</h5>
          {txLoading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3">Loading transactions...</p>
            </div>
          ) : txError ? (
            <div className="text-center py-5">
              <p className="text-danger">{txError}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="40" fill="#C8E6C9" opacity="0.3"/>
                  <g transform="translate(30, 30)">
                    <rect x="0" y="5" width="20" height="3" rx="1.5" fill="#2E7D32"/>
                    <rect x="0" y="12" width="20" height="3" rx="1.5" fill="#2E7D32"/>
                    <rect x="0" y="19" width="20" height="3" rx="1.5" fill="#2E7D32"/>
                  </g>
                </svg>
              </div>
              <p className="text-muted">Your AUD transactions will appear here.</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.txid}>
                    <td>
                      <Badge bg={tx.type === "receive" ? "success" : "danger"}>
                        {tx.type === "receive" ? "↘ Receive" : "↗ Send"}
                      </Badge>
                    </td>
                    <td className={tx.type === "receive" ? "text-success" : "text-danger"}>
                      {tx.type === "receive" ? "+" : "-"}${tx.amountAud.toFixed(2)} AUD
                    </td>
                    <td>
                      {tx.confirmed ? (
                        <Badge bg="success">Confirmed</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">Pending</Badge>
                      )}
                    </td>
                    <td>{formatDate(tx.timestamp)}</td>
                    <td>
                      <a
                        href={`https://etherscan.io/tx/${tx.txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        <code>{truncateTxid(tx.txid)}</code>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Deposit Modal */}
      <Modal show={showDepositModal} onHide={() => setShowDepositModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Deposit AUD Stablecoin</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="text-muted mb-3">
            Send AUD stablecoins (ERC-20) to the following Ethereum address:
          </p>
          {depositAddress && (
            <div className="mb-3">
              <QRCodeSVG
                value={depositAddress}
                size={200}
                level="M"
              />
            </div>
          )}
          <div className="bg-light p-3 rounded mb-3">
            <code className="text-break" style={{ fontSize: "0.85rem" }}>
              {depositAddress}
            </code>
          </div>
          <div className="alert alert-warning mb-0 text-start">
            <small>
              <strong>Important:</strong> Only send AUD stablecoins on the Ethereum network to this address.
              Sending other tokens or using a different network may result in permanent loss of funds.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDepositModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
