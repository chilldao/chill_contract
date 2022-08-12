import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

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
            const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
            let unlockTime = 0;
            unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
            const { contract } = await loadFixture(deployXDDFixture);
            await expect(contract.setPrivateUnLockSec(unlockTime))
            .to.emit(contract, "SetPrivateUnLockSec")
            .withArgs(unlockTime, anyValue); // We accept any value as `when` arg

            await expect(contract.setAdviserUnLockSec(unlockTime))
            .to.emit(contract, "SetAdviserUnLockSec")
            .withArgs(unlockTime, anyValue); // We accept any value as `when` arg

            await expect(contract.setTeamUnLockSec(unlockTime))
            .to.emit(contract, "SetTeamUnLockSec")
            .withArgs(unlockTime, anyValue); // We accept any value as `when` arg

            expect(await contract.privateUnLockSec()).to.equal(unlockTime);
            expect(await contract.adviserUnLockSec()).to.equal(unlockTime);
            expect(await contract.teamUnLockSec()).to.equal(unlockTime);
        });

        it("Should revert with the right error if called too soon", async function () {
            const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
            let unlockTime = 0;
            unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
            const { contract } = await loadFixture(deployXDDFixture);
            await contract.setPrivateUnLockSec(unlockTime);
            await contract.setAdviserUnLockSec(unlockTime);
            await contract.setTeamUnLockSec(unlockTime);

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
            const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
            let unlockTime = 0;
            unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
            const {
                contract,
                PrivateLock,
                AdviserLock,
                TeamLock,
            } = await loadFixture(deployXDDFixture);
            const PRECISION = BigInt(await contract.PRECISION());
            await contract.setPrivateUnLockSec(unlockTime);
            await contract.setAdviserUnLockSec(unlockTime);
            await contract.setTeamUnLockSec(unlockTime);

            const privateAddr1Percent = 1n * PRECISION / 100n;
            const privateAddr2Percent = 2n * PRECISION / 100n;
            const privateAddr3Percent = 3n * PRECISION / 100n;
            const adviserAddr1Percent = 4n * PRECISION / 100n;
            const adviserAddr2Percent = 5n * PRECISION / 100n;
            const adviserAddr3Percent = 6n * PRECISION / 100n;
            const teamAddr1Percent = 7n * PRECISION / 100n;
            const teamAddr2Percent = 8n * PRECISION / 100n;
            const teamAddr3Percent = 9n * PRECISION / 100n;
            const [owner, account1, account2] = await ethers.getSigners();
            await contract.setPrivateLockAddr(
                [owner.address, account1.address, account2.address],
                [privateAddr1Percent, privateAddr2Percent, privateAddr3Percent]
            );
            await contract.setAdviserLockAddr(
                [owner.address, account1.address, account2.address],
                [adviserAddr1Percent, adviserAddr2Percent, adviserAddr3Percent]
            );
            await contract.setTeamLockAddr(
                [owner.address, account1.address, account2.address],
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

            await time.increaseTo(unlockTime);

            await expect(contract.claimPrivateUnLockFunds())
            .to.emit(contract, "ClaimPrivateUnLockFunds")
            .withArgs(PrivateLock * privateAddr1Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [owner, contract],
                [PrivateLock * privateAddr1Percent / PRECISION, 0]
            );
            await expect(contract.connect(account1).claimPrivateUnLockFunds())
            .to.emit(contract, "ClaimPrivateUnLockFunds")
            .withArgs(PrivateLock * privateAddr2Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [account1, contract],
                [PrivateLock * privateAddr2Percent / PRECISION, 0]
            );
            await expect(contract.connect(account2).claimPrivateUnLockFunds())
            .to.emit(contract, "ClaimPrivateUnLockFunds")
            .withArgs(PrivateLock * privateAddr3Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [account2, contract],
                [PrivateLock * privateAddr3Percent / PRECISION, 0]
            );

            await expect(contract.claimAdviserUnLockFunds())
            .to.emit(contract, "ClaimAdviserUnLockFunds")
            .withArgs(AdviserLock * adviserAddr1Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [owner, contract],
                [AdviserLock * adviserAddr1Percent / PRECISION, 0]
            );
            await expect(contract.connect(account1).claimAdviserUnLockFunds())
            .to.emit(contract, "ClaimAdviserUnLockFunds")
            .withArgs(AdviserLock * adviserAddr2Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [account1, contract],
                [AdviserLock * adviserAddr2Percent / PRECISION, 0]
            );
            await expect(contract.connect(account2).claimAdviserUnLockFunds())
            .to.emit(contract, "ClaimAdviserUnLockFunds")
            .withArgs(AdviserLock * adviserAddr3Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [account2, contract],
                [AdviserLock * adviserAddr3Percent / PRECISION, 0]
            );

            await expect(contract.claimTeamUnLockFunds())
            .to.emit(contract, "ClaimTeamUnLockFunds")
            .withArgs(TeamLock * teamAddr1Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [owner, contract],
                [TeamLock * teamAddr1Percent / PRECISION, 0]
            );
            await expect(contract.connect(account1).claimTeamUnLockFunds())
            .to.emit(contract, "ClaimTeamUnLockFunds")
            .withArgs(TeamLock * teamAddr2Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [account1, contract],
                [TeamLock * teamAddr2Percent / PRECISION, 0]
            );
            await expect(contract.connect(account2).claimTeamUnLockFunds())
            .to.emit(contract, "ClaimTeamUnLockFunds")
            .withArgs(TeamLock * teamAddr3Percent / PRECISION)
            .to.changeTokenBalances(
                contract,
                [account2, contract],
                [TeamLock * teamAddr3Percent / PRECISION, 0]
            );
        });
    });
});
