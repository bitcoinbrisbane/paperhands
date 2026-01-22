import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Table } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import api2 from "../services/api2";

type Token = "AAUD" | "USDC" | "USDT";

interface CapitalSupply {
  id: number;
  userId: number;
  token: string;
  amount: number;
  walletAddress: string;
  txHash: string | null;
  status: string;
  createdAt: string;
}

interface DepositAddress {
  id: number;
  address: string;
  token: string;
  createdAt: string;
  isNew: boolean;
}

export function Capital() {
  const [selectedToken, setSelectedToken] = useState<Token>("AAUD");
  const [amount, setAmount] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [supplies, setSupplies] = useState<CapitalSupply[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositToken, setDepositToken] = useState<Token>("AAUD");
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
  const [generatingAddress, setGeneratingAddress] = useState(false);

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      // TODO: Get actual user ID from auth context
      const userId = 1; // Temporary: using test user ID
      const response = await api2.get<CapitalSupply[]>(`/capital?userId=${userId}`);
      setSupplies(response.data);
    } catch (err) {
      console.error("Error fetching capital supplies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        setError("Please install MetaMask to connect your wallet");
        return;
      }

      // Request account access
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        setError("");
        setSuccess("Wallet connected successfully");
      }
    } catch (err) {
      setError("Failed to connect wallet. Please try again.");
      console.error(err);
    }
  };

  const handleSupply = async () => {
    setError("");
    setSuccess("");

    if (!walletConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);

      // TODO: Implement actual smart contract interaction to get tx_hash
      // For now, we'll create a mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      // TODO: Get actual user ID from auth context
      const userId = 1; // Temporary: using test user ID

      await api2.post("/capital", {
        userId,
        token: selectedToken,
        amount: parseFloat(amount),
        walletAddress,
        txHash: mockTxHash,
      });

      setSuccess(`Successfully supplied ${amount} ${selectedToken}`);
      setAmount("");

      // Refresh the supplies list
      fetchSupplies();
    } catch (err) {
      setError("Failed to supply capital. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDepositAddress = async () => {
    setError("");
    setSuccess("");

    try {
      setGeneratingAddress(true);

      // TODO: Get actual user ID from auth context
      const userId = 1; // Temporary: using test user ID

      const response = await api2.post<DepositAddress>("/capital/deposit-address", {
        userId,
        token: depositToken,
      });

      setDepositAddress(response.data);

      if (response.data.isNew) {
        setSuccess(`New deposit address generated for ${depositToken}`);
      } else {
        setSuccess(`Retrieved existing deposit address for ${depositToken}`);
      }
    } catch (err) {
      setError("Failed to generate deposit address. Please try again.");
      console.error(err);
    } finally {
      setGeneratingAddress(false);
    }
  };

  const handleCopyAddress = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress.address);
      setSuccess("Address copied to clipboard!");
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h4 className="mb-2">Supply Capital</h4>
        <p className="text-muted mb-0">
          Supply stablecoins (AAUD, USDC, or USDT) to earn interest by lending to BTC-backed loan borrowers
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      <Row>
        <Col md={8} lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Supply Tokens</Card.Title>

              {!walletConnected ? (
                <div className="text-center py-4">
                  <p className="mb-3">Connect your Ethereum wallet to get started</p>
                  <Button variant="primary" onClick={handleConnectWallet}>
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <>
                  <Alert variant="info" className="mb-3">
                    <small>
                      <strong>Connected:</strong> {walletAddress.substring(0, 6)}...
                      {walletAddress.substring(walletAddress.length - 4)}
                    </small>
                  </Alert>

                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Token</Form.Label>
                      <Form.Select
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value as Token)}
                      >
                        <option value="AAUD">AAUD</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Amount</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </Form.Group>

                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={handleSupply}
                    >
                      Supply {selectedToken}
                    </Button>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} lg={6}>
          <Card className="bg-light">
            <Card.Body>
              <Card.Title>Information</Card.Title>
              <Card.Text>
                <strong>Supported Tokens:</strong>
                <ul>
                  <li>AAUD - Australian Dollar Stablecoin</li>
                  <li>USDC - USD Coin</li>
                  <li>USDT - Tether USD</li>
                </ul>
                <small className="text-muted">
                  All tokens must be on the Ethereum network.
                </small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12} lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Deposit by QR Code</Card.Title>
              <p className="text-muted">
                Generate a unique deposit address for your tokens. Send funds to this address and they will be swept later.
              </p>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Token</Form.Label>
                  <Form.Select
                    value={depositToken}
                    onChange={(e) => setDepositToken(e.target.value as Token)}
                  >
                    <option value="AAUD">AAUD</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </Form.Select>
                </Form.Group>

                <Button
                  variant="primary"
                  className="w-100 mb-3"
                  onClick={handleGenerateDepositAddress}
                  disabled={generatingAddress}
                >
                  {generatingAddress ? "Generating..." : "Generate Deposit Address"}
                </Button>
              </Form>

              {depositAddress && (
                <div className="text-center">
                  <Alert variant="info">
                    <small>
                      <strong>Deposit Address ({depositAddress.token}):</strong>
                    </small>
                    <div className="mt-2 mb-2" style={{ wordBreak: "break-all", fontSize: "0.9rem" }}>
                      {depositAddress.address}
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={handleCopyAddress}
                    >
                      Copy Address
                    </Button>
                  </Alert>

                  <div className="d-flex justify-content-center mt-3 mb-3">
                    <QRCodeSVG
                      value={depositAddress.address}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <small className="text-muted">
                    Scan the QR code to get the deposit address
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} lg={6} className="mt-4 mt-lg-0">
          <Card className="bg-light">
            <Card.Body>
              <Card.Title>How to Deposit</Card.Title>
              <ol>
                <li>Select the token you want to deposit</li>
                <li>Click "Generate Deposit Address"</li>
                <li>Send your tokens to the generated address</li>
                <li>Funds will be swept and credited to your account later</li>
              </ol>
              <Alert variant="warning" className="mt-3">
                <small>
                  <strong>Important:</strong> Only send the selected token type to this address. Sending other tokens may result in loss of funds.
                </small>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Your Capital Supplies</Card.Title>
              {loading && supplies.length === 0 ? (
                <p className="text-muted">Loading...</p>
              ) : supplies.length === 0 ? (
                <p className="text-muted">No capital supplied yet.</p>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Token</th>
                      <th>Amount</th>
                      <th>Wallet Address</th>
                      <th>Status</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplies.map((supply) => (
                      <tr key={supply.id}>
                        <td>{new Date(supply.createdAt).toLocaleDateString()}</td>
                        <td>{supply.token}</td>
                        <td>{supply.amount.toFixed(2)}</td>
                        <td>
                          <small>
                            {supply.walletAddress.substring(0, 6)}...
                            {supply.walletAddress.substring(supply.walletAddress.length - 4)}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${
                              supply.status === "pending"
                                ? "warning"
                                : supply.status === "completed"
                                ? "success"
                                : "secondary"
                            }`}
                          >
                            {supply.status}
                          </span>
                        </td>
                        <td>
                          {supply.txHash ? (
                            <small>
                              <a
                                href={`https://etherscan.io/tx/${supply.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {supply.txHash.substring(0, 6)}...
                                {supply.txHash.substring(supply.txHash.length - 4)}
                              </a>
                            </small>
                          ) : (
                            <small className="text-muted">-</small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
