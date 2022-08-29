import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

const ONE_YEAR_IN_SECS = 12 * 30 * 24 * 60 * 60;
describe("XDD", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployXDDFixture() {
    const DECIMAL = 18n;
    const TotalSupply = 5n * 10n ** 9n * 10n ** DECIMAL;
    const PrivateLock = (TotalSupply * 16n) / 100n;
    const AdviserLock = (TotalSupply * 2n) / 100n;
    const TeamLock = (TotalSupply * 15n) / 100n;
    const FirstMintAmount = TotalSupply - PrivateLock - AdviserLock - TeamLock;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("XDD");
    const contract = await upgrades.deployProxy(Contract, [], {
      kind: "transparent",
    });

    return {
      contract,
      owner,
      TotalSupply,
      PrivateLock,
      AdviserLock,
      TeamLock,
      FirstMintAmount,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should Initialized funds correctly", async function () {
      const {
        contract,
        owner,
        TotalSupply,
        PrivateLock,
        AdviserLock,
        TeamLock,
        FirstMintAmount,
      } = await loadFixture(deployXDDFixture);

      // console.log("    TotalSupply: ", TotalSupply)
      // console.log("    PrivateLock: ", PrivateLock)
      // console.log("    AdviserLock: ", AdviserLock)
      // console.log("       TeamLock: ", TeamLock)
      // console.log("FirstMintAmount: ", FirstMintAmount)
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.TotalSupply()).to.equal(TotalSupply);
      expect(await contract.PrivateLock()).to.equal(PrivateLock);
      expect(await contract.AdviserLock()).to.equal(AdviserLock);
      expect(await contract.TeamLock()).to.equal(TeamLock);
      expect(await contract.totalSupply()).to.equal(FirstMintAmount);
    });

    it("Should Initialized percent correctly", async function () {
      const { contract } = await loadFixture(deployXDDFixture);
      expect(await contract.privateLockTotalPercent()).to.equal(0);
      expect(await contract.adviserLockTotalPercent()).to.equal(0);
      expect(await contract.teamLockTotalPercent()).to.equal(0);
    });
  });

  describe("lockTime", function () {
    it("Should revert with the right error if locked funds", async function () {
      const { contract } = await loadFixture(deployXDDFixture);

      await time.increase(10 * ONE_YEAR_IN_SECS)

      await expect(contract.claimPrivateUnLockFunds()).to.be.revertedWith(
        "The address has no locked private funds"
      );
      await expect(contract.claimAdviserUnLockFunds()).to.be.revertedWith(
        "The address has no locked adviser funds"
      );
      await expect(contract.claimTeamUnLockFunds()).to.be.revertedWith(
        "The address has no locked team funds"
      );
    });

    it("Should emit an event on set lock time", async function () {
      let unlockTime = 0;
      unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const { contract } = await loadFixture(deployXDDFixture);
      await expect(contract.setPrivateUnLockTs(unlockTime, ONE_YEAR_IN_SECS))
      .to.emit(contract, "SetPrivateUnLockTs")
      .withArgs(unlockTime, ONE_YEAR_IN_SECS, anyValue, anyValue);

      await expect(contract.setAdviserUnLockTs(unlockTime, ONE_YEAR_IN_SECS))
      .to.emit(contract, "SetAdviserUnLockTs")
      .withArgs(unlockTime, ONE_YEAR_IN_SECS, anyValue, anyValue);

      await expect(contract.setTeamUnLockTs(unlockTime, ONE_YEAR_IN_SECS))
      .to.emit(contract, "SetTeamUnLockTs")
      .withArgs(unlockTime, ONE_YEAR_IN_SECS, anyValue, anyValue);

      expect(await contract.privateUnLockTs()).to.equal(unlockTime);
      expect(await contract.privateUnLockDuration()).to.equal(ONE_YEAR_IN_SECS);
      expect(await contract.adviserUnLockTs()).to.equal(unlockTime);
      expect(await contract.adviserUnLockDuration()).to.equal(ONE_YEAR_IN_SECS);
      expect(await contract.teamUnLockTs()).to.equal(unlockTime);
      expect(await contract.teamUnLockDuration()).to.equal(ONE_YEAR_IN_SECS);
    });

    it("Should revert with the right error if called too soon", async function () {
      let unlockTime = 0;
      unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const { contract } = await loadFixture(deployXDDFixture);
      await contract.setPrivateUnLockTs(unlockTime, ONE_YEAR_IN_SECS);
      await contract.setAdviserUnLockTs(unlockTime, ONE_YEAR_IN_SECS);
      await contract.setTeamUnLockTs(unlockTime, ONE_YEAR_IN_SECS);

      await expect(contract.claimPrivateUnLockFunds()).to.be.revertedWith(
        "private funds still during the lock-up period"
      );
      await expect(contract.claimAdviserUnLockFunds()).to.be.revertedWith(
        "adviser funds still during the lock-up period"
      );
      await expect(contract.claimTeamUnLockFunds()).to.be.revertedWith(
        "team funds still during the lock-up period"
      );
    });
  });

  describe("set and claim token", function () {
    it("The normal flow should succeed", async function () {
      let unlockTime = 0;
      unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const {
        contract,
        PrivateLock,
        AdviserLock,
        TeamLock,
      } = await loadFixture(deployXDDFixture);
      const ONE_HUNDRED_PERCENT = BigInt(await contract.ONE_HUNDRED_PERCENT());
      await contract.setPrivateUnLockTs(unlockTime, ONE_YEAR_IN_SECS);
      await contract.setAdviserUnLockTs(unlockTime, ONE_YEAR_IN_SECS);
      await contract.setTeamUnLockTs(unlockTime, ONE_YEAR_IN_SECS);

      const privateAddr1Percent = 1n * ONE_HUNDRED_PERCENT / 100n;
      const privateAddr2Percent = 2n * ONE_HUNDRED_PERCENT / 100n;
      const privateAddr3Percent = 3n * ONE_HUNDRED_PERCENT / 100n;
      const adviserAddr1Percent = 4n * ONE_HUNDRED_PERCENT / 100n;
      const adviserAddr2Percent = 5n * ONE_HUNDRED_PERCENT / 100n;
      const adviserAddr3Percent = 6n * ONE_HUNDRED_PERCENT / 100n;
      const teamAddr1Percent = 7n * ONE_HUNDRED_PERCENT / 100n;
      const teamAddr2Percent = 8n * ONE_HUNDRED_PERCENT / 100n;
      const teamAddr3Percent = 9n * ONE_HUNDRED_PERCENT / 100n;
      const [account1, account2, account3] = await ethers.getSigners();
      await contract.setPrivateLockAddr(
        [account1.address, account2.address, account3.address],
        [privateAddr1Percent, privateAddr2Percent, privateAddr3Percent]
      );
      await contract.setAdviserLockAddr(
        [account1.address, account2.address, account3.address],
        [adviserAddr1Percent, adviserAddr2Percent, adviserAddr3Percent]
      );
      await contract.setTeamLockAddr(
        [account1.address, account2.address, account3.address],
        [teamAddr1Percent, teamAddr2Percent, teamAddr3Percent]
      );

      expect(await contract.privateLockTotalPercent()).to.equal(
        privateAddr1Percent + privateAddr2Percent + privateAddr3Percent
      );
      expect(await contract.adviserLockTotalPercent()).to.equal(
        adviserAddr1Percent + adviserAddr2Percent + adviserAddr3Percent
      );
      expect(await contract.teamLockTotalPercent()).to.equal(
        teamAddr1Percent + teamAddr2Percent + teamAddr3Percent
      );
      expect(await contract.queryPrivateTotalLockFunds(account1.address)).to.equal(
        PrivateLock * privateAddr1Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryPrivateTotalLockFunds(account2.address)).to.equal(
        PrivateLock * privateAddr2Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryPrivateTotalLockFunds(account3.address)).to.equal(
        PrivateLock * privateAddr3Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryAdviserTotalLockFunds(account1.address)).to.equal(
        AdviserLock * adviserAddr1Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryAdviserTotalLockFunds(account2.address)).to.equal(
        AdviserLock * adviserAddr2Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryAdviserTotalLockFunds(account3.address)).to.equal(
        AdviserLock * adviserAddr3Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryTeamTotalLockFunds(account1.address)).to.equal(
        TeamLock * teamAddr1Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryTeamTotalLockFunds(account2.address)).to.equal(
        TeamLock * teamAddr2Percent / ONE_HUNDRED_PERCENT
      );
      expect(await contract.queryTeamTotalLockFunds(account3.address)).to.equal(
        TeamLock * teamAddr3Percent / ONE_HUNDRED_PERCENT
      );

      await time.increaseTo(unlockTime + 10 * ONE_YEAR_IN_SECS);

      await expect(contract.claimPrivateUnLockFunds())
      .to.emit(contract, "ClaimPrivateUnLockFunds")
      .withArgs(PrivateLock * privateAddr1Percent / ONE_HUNDRED_PERCENT,
        PrivateLock * privateAddr1Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account1, contract],
        [PrivateLock * privateAddr1Percent / ONE_HUNDRED_PERCENT, 0]
      );
      await expect(contract.connect(account2).claimPrivateUnLockFunds())
      .to.emit(contract, "ClaimPrivateUnLockFunds")
      .withArgs(PrivateLock * privateAddr2Percent / ONE_HUNDRED_PERCENT,
        PrivateLock * privateAddr2Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account2, contract],
        [PrivateLock * privateAddr2Percent / ONE_HUNDRED_PERCENT, 0]
      );
      await expect(contract.connect(account3).claimPrivateUnLockFunds())
      .to.emit(contract, "ClaimPrivateUnLockFunds")
      .withArgs(PrivateLock * privateAddr3Percent / ONE_HUNDRED_PERCENT,
        PrivateLock * privateAddr3Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account3, contract],
        [PrivateLock * privateAddr3Percent / ONE_HUNDRED_PERCENT, 0]
      );

      await expect(contract.claimAdviserUnLockFunds())
      .to.emit(contract, "ClaimAdviserUnLockFunds")
      .withArgs(AdviserLock * adviserAddr1Percent / ONE_HUNDRED_PERCENT,
        AdviserLock * adviserAddr1Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account1, contract],
        [AdviserLock * adviserAddr1Percent / ONE_HUNDRED_PERCENT, 0]
      );
      await expect(contract.connect(account2).claimAdviserUnLockFunds())
      .to.emit(contract, "ClaimAdviserUnLockFunds")
      .withArgs(AdviserLock * adviserAddr2Percent / ONE_HUNDRED_PERCENT, 
        AdviserLock * adviserAddr2Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account2, contract],
        [AdviserLock * adviserAddr2Percent / ONE_HUNDRED_PERCENT, 0]
      );
      await expect(contract.connect(account3).claimAdviserUnLockFunds())
      .to.emit(contract, "ClaimAdviserUnLockFunds")
      .withArgs(AdviserLock * adviserAddr3Percent / ONE_HUNDRED_PERCENT,
        AdviserLock * adviserAddr3Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account3, contract],
        [AdviserLock * adviserAddr3Percent / ONE_HUNDRED_PERCENT, 0]
      );

      await expect(contract.claimTeamUnLockFunds())
      .to.emit(contract, "ClaimTeamUnLockFunds")
      .withArgs(TeamLock * teamAddr1Percent / ONE_HUNDRED_PERCENT,
        TeamLock * teamAddr1Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account1, contract],
        [TeamLock * teamAddr1Percent / ONE_HUNDRED_PERCENT, 0]
      );
      await expect(contract.connect(account2).claimTeamUnLockFunds())
      .to.emit(contract, "ClaimTeamUnLockFunds")
      .withArgs(TeamLock * teamAddr2Percent / ONE_HUNDRED_PERCENT,
        TeamLock * teamAddr2Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account2, contract],
        [TeamLock * teamAddr2Percent / ONE_HUNDRED_PERCENT, 0]
      );
      await expect(contract.connect(account3).claimTeamUnLockFunds())
      .to.emit(contract, "ClaimTeamUnLockFunds")
      .withArgs(TeamLock * teamAddr3Percent / ONE_HUNDRED_PERCENT,
        TeamLock * teamAddr3Percent / ONE_HUNDRED_PERCENT)
      .to.changeTokenBalances(
        contract,
        [account3, contract],
        [TeamLock * teamAddr3Percent / ONE_HUNDRED_PERCENT, 0]
      );
    });


    it("Withdrawal of income in the middle should succeed", async function () {
      let unlockTime = 0;
      unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      const {
        contract,
        PrivateLock,
        AdviserLock,
        TeamLock,
      } = await loadFixture(deployXDDFixture);
      const ONE_HUNDRED_PERCENT = BigInt(await contract.ONE_HUNDRED_PERCENT());
      await contract.setPrivateUnLockTs(unlockTime, ONE_YEAR_IN_SECS);
      await contract.setAdviserUnLockTs(unlockTime, ONE_YEAR_IN_SECS);
      await contract.setTeamUnLockTs(unlockTime, ONE_YEAR_IN_SECS);

      const privateAddrPercent = 1n * ONE_HUNDRED_PERCENT / 100n;
      const adviserAddrPercent = 2n * ONE_HUNDRED_PERCENT / 100n;
      const teamAddrPercent = 3n * ONE_HUNDRED_PERCENT / 100n;
      const [account1] = await ethers.getSigners();
      await contract.setPrivateLockAddr(
        [account1.address],
        [privateAddrPercent]
      );
      await contract.setAdviserLockAddr(
        [account1.address],
        [adviserAddrPercent]
      );
      await contract.setTeamLockAddr(
        [account1.address],
        [teamAddrPercent]
      );

      expect(await contract.privateLockTotalPercent()).to.equal(privateAddrPercent);
      expect(await contract.adviserLockTotalPercent()).to.equal(adviserAddrPercent);
      expect(await contract.teamLockTotalPercent()).to.equal(teamAddrPercent);

      await time.increaseTo(unlockTime + ONE_YEAR_IN_SECS / 10);

      const targetPrivateClaimed = PrivateLock * privateAddrPercent / ONE_HUNDRED_PERCENT; 
      try {
        await expect(contract.claimPrivateUnLockFunds())
        .to.emit(contract, "ClaimPrivateUnLockFunds")
        .withArgs( targetPrivateClaimed / 10n,
           targetPrivateClaimed/ 10n)
        .to.changeTokenBalances(
          contract,
          [account1, contract],
          [targetPrivateClaimed / 10n, 0]
        );
      } catch (e) {
        // The high probability is that it takes a little more time to execute (usually 1 second)
        expect(await contract.privateClaimed(account1.address)).to.
          greaterThan(targetPrivateClaimed / 10n).
          lessThan(targetPrivateClaimed / 10n + targetPrivateClaimed * 6n / BigInt(ONE_YEAR_IN_SECS));
      }

      const targetAdviserClaimed = AdviserLock * adviserAddrPercent / ONE_HUNDRED_PERCENT; 
      try {
        await expect(contract.claimAdviserUnLockFunds())
        .to.emit(contract, "ClaimAdviserUnLockFunds")
        .withArgs( targetAdviserClaimed / 10n,
           targetAdviserClaimed/ 10n)
        .to.changeTokenBalances(
          contract,
          [account1, contract],
          [targetAdviserClaimed / 10n, 0]
        );
      } catch (e) {
        // The high probability is that it takes a little more time to execute (usually 1 second)
        expect(await contract.adviserClaimed(account1.address)).to.
          greaterThan(targetAdviserClaimed / 10n).
          lessThan(targetAdviserClaimed / 10n + targetAdviserClaimed * 6n / BigInt(ONE_YEAR_IN_SECS));
      }

      const targetTeamClaimed = TeamLock * teamAddrPercent / ONE_HUNDRED_PERCENT; 
      try {
        await expect(contract.claimTeamUnLockFunds())
        .to.emit(contract, "ClaimTeamUnLockFunds")
        .withArgs( targetTeamClaimed / 10n,
           targetTeamClaimed/ 10n)
        .to.changeTokenBalances(
          contract,
          [account1, contract],
          [targetTeamClaimed / 10n, 0]
        );
      } catch (e) {
        // The high probability is that it takes a little more time to execute (usually 1 second)
        expect(await contract.teamClaimed(account1.address)).to.
          greaterThan(targetTeamClaimed / 10n).
          lessThan(targetTeamClaimed / 10n + targetTeamClaimed * 6n / BigInt(ONE_YEAR_IN_SECS));
      }

      await time.increase(ONE_YEAR_IN_SECS / 5);

      try {
        await expect(contract.claimPrivateUnLockFunds())
        .to.emit(contract, "ClaimPrivateUnLockFunds")
        .withArgs( targetPrivateClaimed  / 5n,
           targetPrivateClaimed * 3n / 10n)
        .to.changeTokenBalances(
          contract,
          [account1, contract],
          [targetPrivateClaimed / 5n, 0]
        );
      } catch (e) {
        // The high probability is that it takes a little more time to execute (usually 1 second)
        expect(await contract.privateClaimed(account1.address)).to.
          greaterThan(targetPrivateClaimed * 3n / 10n).
          lessThan(targetPrivateClaimed * 3n / 10n + targetPrivateClaimed * 10n / BigInt(ONE_YEAR_IN_SECS));
      }

      try {
        await expect(contract.claimAdviserUnLockFunds())
        .to.emit(contract, "ClaimAdviserUnLockFunds")
        .withArgs( targetAdviserClaimed  / 5n,
           targetAdviserClaimed * 3n / 10n)
        .to.changeTokenBalances(
          contract,
          [account1, contract],
          [targetAdviserClaimed / 5n, 0]
        );
      } catch (e) {
        // The high probability is that it takes a little more time to execute (usually 1 second)
        expect(await contract.adviserClaimed(account1.address)).to.
          greaterThan(targetAdviserClaimed * 3n / 10n).
          lessThan(targetAdviserClaimed * 3n / 10n + targetAdviserClaimed * 10n / BigInt(ONE_YEAR_IN_SECS));
      }

      try {
        await expect(contract.claimTeamUnLockFunds())
        .to.emit(contract, "ClaimTeamUnLockFunds")
        .withArgs( targetTeamClaimed  / 5n,
           targetTeamClaimed * 3n / 10n)
        .to.changeTokenBalances(
          contract,
          [account1, contract],
          [targetTeamClaimed / 5n, 0]
        );
      } catch (e) {
        // The high probability is that it takes a little more time to execute (usually 1 second)
        expect(await contract.teamClaimed(account1.address)).to.
          greaterThan(targetTeamClaimed * 3n / 10n).
          lessThan(targetTeamClaimed * 3n / 10n + targetTeamClaimed * 10n / BigInt(ONE_YEAR_IN_SECS));
      }
    });
  });
});
