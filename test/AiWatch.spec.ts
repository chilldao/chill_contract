import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

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
    it("Should mint correctly", async function () {
      const {
        contract,
        owner,
      } = await loadFixture(deployAiWatchFixture);
      await expect(contract.mint(owner.address, 1))
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
      await contract.mint(owner.address, 1);
      await expect(contract.mint(owner.address, 1)).to.be.revertedWith(
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
      await contract.mint(owner.address, 1)
      expect(await contract.tokenURI(1)).to.equal("");
      expect(await contract._buri()).to.equal("");
      const url = "https://chill_img.org/";
      await contract.setBaseURI(url)
      expect(await contract.tokenURI(1)).to.equal(url + "1");
      await contract.mint(owner.address, 2)
      expect(await contract.tokenURI(2)).to.equal(url + "2");
    });
  });
});
