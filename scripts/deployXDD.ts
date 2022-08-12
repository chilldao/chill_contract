import { ethers, upgrades } from "hardhat";

async function main() {

    const Contract = await ethers.getContractFactory("XDD");
    const contract = await upgrades.deployProxy(Contract, [], {kind: 'transparent'});

    await contract.deployed();

    console.log("XDD address:", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
