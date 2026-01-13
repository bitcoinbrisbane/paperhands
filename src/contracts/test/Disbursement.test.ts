import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Disbursement, MockAUDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Disbursement", function () {
  const AUDC_DECIMALS = 6;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", AUDC_DECIMALS); // 1M AUDC
  const CONTRACT_FUNDING = ethers.parseUnits("500000", AUDC_DECIMALS); // 500K AUDC

  async function deployFixture() {
    const [owner, recipient1, recipient2, other] = await ethers.getSigners();

    // Deploy MockAUDC
    const MockAUDC = await ethers.getContractFactory("MockAUDC");
    const audc = await MockAUDC.deploy("Australian Dollar Coin", "AUDC", AUDC_DECIMALS);

    // Deploy Disbursement
    const Disbursement = await ethers.getContractFactory("Disbursement");
    const disbursement = await Disbursement.deploy(await audc.getAddress());

    // Mint tokens to owner and fund the disbursement contract
    await audc.mint(owner.address, INITIAL_SUPPLY);
    await audc.mint(await disbursement.getAddress(), CONTRACT_FUNDING);

    return { disbursement, audc, owner, recipient1, recipient2, other };
  }

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      const { disbursement, audc } = await loadFixture(deployFixture);
      expect(await disbursement.disbursementToken()).to.equal(await audc.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { disbursement, owner } = await loadFixture(deployFixture);
      expect(await disbursement.owner()).to.equal(owner.address);
    });

    it("Should have the correct balance", async function () {
      const { disbursement } = await loadFixture(deployFixture);
      expect(await disbursement.getBalance()).to.equal(CONTRACT_FUNDING);
    });

    it("Should revert if deployed with zero address token", async function () {
      const Disbursement = await ethers.getContractFactory("Disbursement");
      await expect(Disbursement.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        Disbursement,
        "InvalidAddress"
      );
    });
  });

  describe("Disburse", function () {
    it("Should disburse tokens to recipient", async function () {
      const { disbursement, audc, recipient1 } = await loadFixture(deployFixture);

      const loanId = ethers.encodeBytes32String("LOAN001");
      const amount = ethers.parseUnits("1000", AUDC_DECIMALS);

      const recipientBalanceBefore = await audc.balanceOf(recipient1.address);

      await expect(disbursement.disburse(loanId, recipient1.address, amount))
        .to.emit(disbursement, "DisbursementCompleted")
        .withArgs(
          // disbursementId is dynamic, so we skip checking it
          (id: string) => id.length === 66, // bytes32 hex string
          loanId,
          recipient1.address,
          amount,
          (timestamp: bigint) => timestamp > 0n
        );

      const recipientBalanceAfter = await audc.balanceOf(recipient1.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(amount);
    });

    it("Should increment disbursement count", async function () {
      const { disbursement, recipient1 } = await loadFixture(deployFixture);

      expect(await disbursement.getDisbursementCount()).to.equal(0);

      const loanId = ethers.encodeBytes32String("LOAN001");
      const amount = ethers.parseUnits("1000", AUDC_DECIMALS);

      await disbursement.disburse(loanId, recipient1.address, amount);
      expect(await disbursement.getDisbursementCount()).to.equal(1);

      await disbursement.disburse(
        ethers.encodeBytes32String("LOAN002"),
        recipient1.address,
        amount
      );
      expect(await disbursement.getDisbursementCount()).to.equal(2);
    });

    it("Should revert if not owner", async function () {
      const { disbursement, recipient1, other } = await loadFixture(deployFixture);

      const loanId = ethers.encodeBytes32String("LOAN001");
      const amount = ethers.parseUnits("1000", AUDC_DECIMALS);

      await expect(
        disbursement.connect(other).disburse(loanId, recipient1.address, amount)
      ).to.be.revertedWithCustomError(disbursement, "OwnableUnauthorizedAccount");
    });

    it("Should revert if recipient is zero address", async function () {
      const { disbursement } = await loadFixture(deployFixture);

      const loanId = ethers.encodeBytes32String("LOAN001");
      const amount = ethers.parseUnits("1000", AUDC_DECIMALS);

      await expect(
        disbursement.disburse(loanId, ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(disbursement, "InvalidAddress");
    });

    it("Should revert if amount is zero", async function () {
      const { disbursement, recipient1 } = await loadFixture(deployFixture);

      const loanId = ethers.encodeBytes32String("LOAN001");

      await expect(
        disbursement.disburse(loanId, recipient1.address, 0)
      ).to.be.revertedWithCustomError(disbursement, "InvalidAmount");
    });

    it("Should revert if insufficient balance", async function () {
      const { disbursement, recipient1 } = await loadFixture(deployFixture);

      const loanId = ethers.encodeBytes32String("LOAN001");
      const amount = ethers.parseUnits("1000000", AUDC_DECIMALS); // More than contract has

      await expect(
        disbursement.disburse(loanId, recipient1.address, amount)
      ).to.be.revertedWithCustomError(disbursement, "InsufficientBalance");
    });
  });

  describe("Batch Disburse", function () {
    it("Should batch disburse to multiple recipients", async function () {
      const { disbursement, audc, recipient1, recipient2 } = await loadFixture(deployFixture);

      const loanIds = [
        ethers.encodeBytes32String("LOAN001"),
        ethers.encodeBytes32String("LOAN002"),
      ];
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [
        ethers.parseUnits("1000", AUDC_DECIMALS),
        ethers.parseUnits("2000", AUDC_DECIMALS),
      ];

      const recipient1BalanceBefore = await audc.balanceOf(recipient1.address);
      const recipient2BalanceBefore = await audc.balanceOf(recipient2.address);

      await disbursement.batchDisburse(loanIds, recipients, amounts);

      expect(await audc.balanceOf(recipient1.address) - recipient1BalanceBefore).to.equal(
        amounts[0]
      );
      expect(await audc.balanceOf(recipient2.address) - recipient2BalanceBefore).to.equal(
        amounts[1]
      );
      expect(await disbursement.getDisbursementCount()).to.equal(2);
    });

    it("Should revert if array lengths mismatch", async function () {
      const { disbursement, recipient1, recipient2 } = await loadFixture(deployFixture);

      const loanIds = [ethers.encodeBytes32String("LOAN001")];
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [ethers.parseUnits("1000", AUDC_DECIMALS)];

      await expect(
        disbursement.batchDisburse(loanIds, recipients, amounts)
      ).to.be.revertedWithCustomError(disbursement, "ArrayLengthMismatch");
    });

    it("Should revert if total amount exceeds balance", async function () {
      const { disbursement, recipient1, recipient2 } = await loadFixture(deployFixture);

      const loanIds = [
        ethers.encodeBytes32String("LOAN001"),
        ethers.encodeBytes32String("LOAN002"),
      ];
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [
        ethers.parseUnits("400000", AUDC_DECIMALS),
        ethers.parseUnits("200000", AUDC_DECIMALS),
      ]; // Total > 500K

      await expect(
        disbursement.batchDisburse(loanIds, recipients, amounts)
      ).to.be.revertedWithCustomError(disbursement, "InsufficientBalance");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause and unpause", async function () {
      const { disbursement, recipient1 } = await loadFixture(deployFixture);

      await disbursement.pause();

      const loanId = ethers.encodeBytes32String("LOAN001");
      const amount = ethers.parseUnits("1000", AUDC_DECIMALS);

      await expect(
        disbursement.disburse(loanId, recipient1.address, amount)
      ).to.be.revertedWithCustomError(disbursement, "EnforcedPause");

      await disbursement.unpause();

      await expect(disbursement.disburse(loanId, recipient1.address, amount)).to.not.be.reverted;
    });

    it("Should only allow owner to pause/unpause", async function () {
      const { disbursement, other } = await loadFixture(deployFixture);

      await expect(disbursement.connect(other).pause()).to.be.revertedWithCustomError(
        disbursement,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Admin Functions", function () {
    it("Should update disbursement token", async function () {
      const { disbursement, audc, owner } = await loadFixture(deployFixture);

      // Deploy new token
      const MockAUDC = await ethers.getContractFactory("MockAUDC");
      const newToken = await MockAUDC.deploy("New Token", "NEW", 6);

      await expect(disbursement.setDisbursementToken(await newToken.getAddress()))
        .to.emit(disbursement, "TokenUpdated")
        .withArgs(await audc.getAddress(), await newToken.getAddress());

      expect(await disbursement.disbursementToken()).to.equal(await newToken.getAddress());
    });

    it("Should withdraw tokens", async function () {
      const { disbursement, audc, owner } = await loadFixture(deployFixture);

      const withdrawAmount = ethers.parseUnits("100000", AUDC_DECIMALS);
      const ownerBalanceBefore = await audc.balanceOf(owner.address);

      await disbursement.withdrawTokens(await audc.getAddress(), owner.address, withdrawAmount);

      expect(await audc.balanceOf(owner.address) - ownerBalanceBefore).to.equal(withdrawAmount);
    });

    it("Should revert withdraw to zero address", async function () {
      const { disbursement, audc } = await loadFixture(deployFixture);

      const withdrawAmount = ethers.parseUnits("100000", AUDC_DECIMALS);

      await expect(
        disbursement.withdrawTokens(await audc.getAddress(), ethers.ZeroAddress, withdrawAmount)
      ).to.be.revertedWithCustomError(disbursement, "InvalidAddress");
    });
  });
});
