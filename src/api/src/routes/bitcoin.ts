import { Router, Request, Response } from "express";
import * as bip39 from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";

// Initialize ECC library for bitcoinjs-lib
bitcoin.initEccLib(ecc);

const bip32 = BIP32Factory(ecc);
const router = Router();

interface AddressRequest {
  customerId: number;
  loanId: number;
}

router.post("/address", async (req: Request<object, object, AddressRequest>, res: Response) => {
  try {
    const { customerId, loanId } = req.body;

    if (customerId === undefined || loanId === undefined) {
      res.status(400).json({ error: "customerId and loanId are required" });
      return;
    }

    const seed = process.env.SEED;
    if (!seed) {
      res.status(500).json({ error: "SEED not configured" });
      return;
    }

    // Convert mnemonic to seed
    const seedBuffer = await bip39.mnemonicToSeed(seed);

    // Create HD wallet from seed
    const root = bip32.fromSeed(seedBuffer);

    // Derive path: m/86'/0'/0'/customerId/loanId (BIP86 for Taproot)
    // Using purpose 86 for Taproot (P2TR)
    const path = `m/86'/0'/0'/${customerId}/${loanId}`;
    const child = root.derivePath(path);

    // Generate Taproot (P2TR) address
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: child.publicKey.slice(1, 33), // Remove the prefix byte for x-only pubkey
      network: bitcoin.networks.bitcoin,
    });

    console.log(`Generated Taproot address for customer ${customerId}, loan ${loanId}: ${address}`);

    res.json({
      address,
      customerId,
      loanId,
      path,
    });
  } catch (error) {
    console.error("Error generating address:", error);
    res.status(500).json({ error: "Failed to generate address" });
  }
});

export default router;
