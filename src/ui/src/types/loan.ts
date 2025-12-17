export interface Loan {
  id: number;
  customerId: number;
  amountAud: number;
  collateralBtc: number;
  btcPriceAtCreation: number;
  status: 'pending' | 'active' | 'inactive';
  depositAddress?: string;
  derivationPath?: string;
  createdAt: string;
  updatedAt: string;
}
