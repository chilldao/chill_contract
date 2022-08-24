import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { contracts } from "../typechain-types";

const ONE_YEAR_IN_SECS = 12 * 30 * 24 * 60 * 60;
describe("AiWatch", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployAiWatchFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("AiWatchNFT");
    const contract = await upgrades.deployProxy(Contract, [], {
      kind: "transparent",
    });

    return {
      contract,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should Initialized correctly", async function () {
      const {
        contract,
        owner,
      } = await loadFixture(deployAiWatchFixture);

      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.symbol()).to.equal("AiWatch");
      expect(await contract.name()).to.equal("AiWatchNFT");
    });
  });

  describe("owner mint", function () {
    it("Should revert with the t error", async function () {
      const {
        contract,
        owner,
      } = await loadFixture(deployAiWatchFixture);
      await expect(contract.mint(owner.address, 1, 5)).to.be.revertedWith(
        "t error"
      );
    });

    it("Should mint correctly", async function () {
      const {
        contract,
        owner,
      } = await loadFixture(deployAiWatchFixture);
      await expect(contract.mint(owner.address, 1, 1))
        .to.emit(contract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          owner.address,
          1
        );
    });

    it("Should revert with token already minted error", async function () {
      const {
        contract,
        owner,
      } = await loadFixture(deployAiWatchFixture);
      await contract.mint(owner.address, 1, 1);
      await expect(contract.mint(owner.address, 1, 1)).to.be.revertedWith(
        "ERC721: token already minted"
      );
    });
  });

  describe("token url", function () {
    it("Should set token url correctly", async function () {
      const {
        contract,
        owner
      } = await loadFixture(deployAiWatchFixture);
      await contract.mint(owner.address, 1, 1)
      expect(await contract.tokenURI(1)).to.equal("");
      expect(await contract._buri()).to.equal("");
      const url = "https://chill_img.org/";
      await contract.setBaseURI(url)
      expect(await contract.tokenURI(1)).to.equal(url + "1");
      await contract.mint(owner.address, 2, 2)
      expect(await contract.tokenURI(2)).to.equal(url + "2");
      expect(await contract._properties(1)).to.equal(1);
      expect(await contract._properties(2)).to.equal(2);
    });
  });

  describe("Authorize mint", function () {
    it("Should revert with tMaxCnt length error", async function () {
      const {
        contract,
        otherAccount,
      } = await loadFixture(deployAiWatchFixture);

      const currentTs = await time.latest();
      await expect(contract.addMintAddr(otherAccount.address,
        currentTs + ONE_YEAR_IN_SECS, 10, 10000, 20000, [1,2,3,4,5,6])).to.be.revertedWith(
        "tMaxCnt length error");

      await expect(contract.addMintAddr(otherAccount.address,
        currentTs + ONE_YEAR_IN_SECS, 10, 10000, 20000, [1,2,3,4])).to.be.revertedWith(
        "tMaxCnt length error");
    });
  });

  describe("platformMint", function () {
    it("Should revert with error", async function () {
      const {
        contract,
        owner,
        otherAccount,
      } = await loadFixture(deployAiWatchFixture);

      await expect(contract.connect(otherAccount).platformMint(
        owner.address, 1, 1)).to.be.revertedWith(
        "mint not allowed or permission has expired")
      const currentTs = await time.latest();
      await contract.addMintAddr(otherAccount.address,
        currentTs + ONE_YEAR_IN_SECS, 3, 10000, 20000, [0,1,2,4,5])
      await expect(contract.connect(otherAccount).platformMint(
        owner.address, 10000, 5)).to.be.revertedWith(
        "t error")
      await expect(contract.connect(otherAccount).platformMint(
        owner.address, 9999, 1)).to.be.revertedWith(
        "mint is out of allowable range")
      await contract.connect(otherAccount).platformMint(
        owner.address, 10000, 2)
      await contract.connect(otherAccount).platformMint(
        owner.address, 10001, 2)
      await expect(contract.connect(otherAccount).platformMint(
        owner.address, 10002, 2)).to.be.revertedWith(
        "The type is full")
      await contract.connect(otherAccount).platformMint(
        owner.address, 10003, 3)
      await expect(contract.connect(otherAccount).platformMint(
        owner.address, 10004, 3)).to.be.revertedWith(
        "The number of mint has been used up")
    });
  });
});
