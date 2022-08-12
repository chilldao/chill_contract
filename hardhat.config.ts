import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import '@openzeppelin/hardhat-upgrades'
import "hardhat-contract-sizer"
import dotenv from "dotenv"
dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY
const PRIVATE_KEY: string = process.env.PRIVATE_KEY || '0x1a'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

const config: HardhatUserConfig = {
    paths: {
        sources: './contracts',
    },
    defaultNetwork: 'hardhat',
    solidity: {
        version: '0.8.9',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            // evmVersion: 'istanbul',
        },
    },
    networks: {
        rinkeby: {
            chainId: 4,
            url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [PRIVATE_KEY],
        },
        bsct: {
            chainId: 97,
            url: 'https://data-seed-prebsc-1-s2.binance.org:8545/',
            accounts: [PRIVATE_KEY],
        },
        bsc: {
            chainId: 56,
            url: 'https://bsc-dataseed.binance.org',
            accounts: [PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        currency: 'USD',
        gasPrice: 21,
        enabled: false,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: false,
        disambiguatePaths: false,
    },
};

export default config;
