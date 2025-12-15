import { useState, useEffect, useCallback } from "react";
import { Container, Card, Row, Col, Button, Modal, Spinner, Table, Badge } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api from "../services/api";

interface Transaction {
  txid: string;
  type: "receive" | "send";
  amount: number;
  amountBtc: number;
  fee: number;
  feeBtc: number;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  timestamp: string | null;
}

interface AddressBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
  confirmedBtc: number;
  unconfirmedBtc: number;
  totalBtc: number;
}

export function Transactions() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [balance, setBalance] = useState<AddressBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchAddressData = useCallback(async (address: string) => {
    setTxLoading(true);
    setTxError(null);
    try {
      const [balanceRes, txsRes] = await Promise.all([
        api.get(`/blockchain/address/${address}`),
        api.get(`/blockchain/address/${address}/txs`),
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(txsRes.data.transactions);
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
      const response = await api.post("/bitcoin/address", {
        customerId: 1,
        loanId: 0,
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
        const response = await api.post("/bitcoin/address", {
          customerId: 1,
          loanId: 0,
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
        <div className="btc-icon me-3">
          <span className="bitcoin-badge">₿</span>
        </div>
        <h4 className="mb-0">BTC Transaction account</h4>
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
                  {txLoading ? <Spinner size="sm" /> : `${balance?.confirmedBtc.toFixed(8) ?? "0.00000000"} BTC`}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="mb-3">
                <div className="text-muted mb-2">Unconfirmed</div>
                <div className="h3">
                  {txLoading ? <Spinner size="sm" /> : `${balance?.unconfirmedBtc.toFixed(8) ?? "0.00000000"} BTC`}
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
              {loading ? <Spinner size="sm" /> : <><span className="me-2">↘</span>Deposit BTC</>}
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
              <p className="text-muted">Your transactions will appear here.</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Transaction ID</th>
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
                      {tx.type === "receive" ? "+" : "-"}{tx.amountBtc.toFixed(8)} BTC
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
                        href={`https://mempool.space/tx/${tx.txid}`}
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
          <Modal.Title>Deposit BTC</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="text-muted mb-3">
            Send BTC to the following address:
          </p>
          {depositAddress && (
            <div className="mb-3">
              <QRCodeSVG
                value={`bitcoin:${depositAddress}`}
                size={200}
                level="M"
              />
            </div>
          )}
          <div className="bg-light p-3 rounded">
            <code className="text-break" style={{ fontSize: "0.85rem" }}>
              {depositAddress}
            </code>
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
