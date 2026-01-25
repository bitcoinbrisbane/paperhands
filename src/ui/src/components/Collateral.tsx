import { Container, Card, Row, Col } from "react-bootstrap";

interface CollateralAsset {
  symbol: string;
  name: string;
  description: string;
  network: string;
  icon: string;
  balance: number;
  utilisation: number;
}

const collateralAssets: CollateralAsset[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    description: "Native Bitcoin on the Bitcoin network. The original cryptocurrency and most widely accepted form of collateral.",
    network: "Bitcoin",
    icon: "₿",
    balance: 12.45678901,
    utilisation: 67.5,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    description: "ERC-20 token backed 1:1 by Bitcoin. Enables Bitcoin to be used in Ethereum DeFi applications.",
    network: "Ethereum",
    icon: "₿",
    balance: 3.21098765,
    utilisation: 42.3,
  },
];

export function Collateral() {
  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <div className="btc-icon me-3">
          <span className="bitcoin-badge">₿</span>
        </div>
        <div>
          <h4 className="mb-0">Collateral</h4>
          <p className="text-muted mb-0">
            View supported collateral types for Bitcoin-backed loans
          </p>
        </div>
      </div>

      <Row>
        {collateralAssets.map((asset) => (
          <Col md={6} key={asset.symbol} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <div className="btc-icon me-3">
                    <span className="bitcoin-badge">{asset.icon}</span>
                  </div>
                  <div>
                    <h5 className="mb-0">{asset.name}</h5>
                    <small className="text-muted">{asset.symbol}</small>
                  </div>
                </div>
                <Card.Text>{asset.description}</Card.Text>
                <div className="p-3 bg-light rounded mt-3">
                  <Row>
                    <Col xs={6}>
                      <div className="text-muted small">Balance</div>
                      <div className="h5 mb-0">{asset.balance.toFixed(8)} {asset.symbol}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted small">Utilisation</div>
                      <div className="h5 mb-0">{asset.utilisation.toFixed(1)}%</div>
                    </Col>
                  </Row>
                </div>
                <div className="mt-3">
                  <span className="badge bg-secondary">{asset.network}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <Card.Title>About Collateral</Card.Title>
              <Card.Text>
                Collateral is the asset you deposit to secure your loan. We accept both native Bitcoin (BTC) and Wrapped Bitcoin (WBTC) as collateral for our lending services.
              </Card.Text>
              <ul className="mb-0">
                <li><strong>BTC:</strong> Deposited to a secure multi-signature Bitcoin address</li>
                <li><strong>WBTC:</strong> Deposited via smart contract on the Ethereum network</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
