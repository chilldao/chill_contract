// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract XDD is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable {
    uint8 private constant DECIMAL = 18;
    uint256 public constant TotalSupply = 5 * 10 ** 9 * 10 ** DECIMAL; // 5,000,000,000 XDD
    uint256 public constant PrivateLock = TotalSupply * 16 / 100; // 16%
    uint256 public constant AdviserLock = TotalSupply * 2 / 100; // 2%
    uint256 public constant TeamLock = TotalSupply * 15 / 100; // 15%

    uint256 public privateUnLockSec;
    uint256 public adviserUnLockSec;
    uint256 public teamUnLockSec;

    uint256 public constant PRECISION = 100000;
    uint256 public privateLockTotalPercent;
    uint256 public adviserLockTotalPercent;
    uint256 public teamLockTotalPercent;
    mapping (address=>uint256) public privateLockAddr;
    mapping (address=>uint256) public adviserLockAddr;
    mapping (address=>uint256) public teamLockAddr;

    event SetPrivateUnLockSec(uint256 n, uint256 old);
    event SetAdviserUnLockSec(uint256 n, uint256 old);
    event SetTeamUnLockSec(uint256 n, uint256 old);
    event ClaimPrivateUnLockFunds(uint256 amount);
    event ClaimAdviserUnLockFunds(uint256 amount);
    event ClaimTeamUnLockFunds(uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function decimals() public pure override returns (uint8) {
        return DECIMAL;
    }

    function initialize() initializer public {
        __ERC20_init("XDD Coin", "XDD");
        __ERC20Burnable_init();
        __Ownable_init();
        _mint(msg.sender, TotalSupply - PrivateLock - AdviserLock - TeamLock);
    }

    function setPrivateUnLockSec(uint256 ts) external onlyOwner {
        emit SetPrivateUnLockSec(ts, privateUnLockSec);
        privateUnLockSec = ts;
    }

    function setAdviserUnLockSec(uint256 ts) external onlyOwner {
        emit SetAdviserUnLockSec(ts, adviserUnLockSec);
        adviserUnLockSec = ts;
    }

    function setTeamUnLockSec(uint256 ts) external onlyOwner {
        emit SetTeamUnLockSec(ts, teamUnLockSec);
        teamUnLockSec = ts;
    }

    function claimPrivateUnLockFunds() external {
        require(block.timestamp > privateUnLockSec, "private funds still during the lock-up period");
        uint256 amount = PrivateLock * privateLockAddr[msg.sender] / PRECISION;
        require(amount > 0, "The address has no locked private funds");
        _mint(msg.sender, amount);
        privateLockAddr[msg.sender] = 0;
        emit ClaimPrivateUnLockFunds(amount);
    }

    function claimAdviserUnLockFunds() external {
        require(block.timestamp > adviserUnLockSec, "adviser funds still during the lock-up period");
        uint256 amount = AdviserLock * adviserLockAddr[msg.sender] / PRECISION;
        require(amount > 0, "The address has no locked adviser funds");
        _mint(msg.sender, amount);
        adviserLockAddr[msg.sender] = 0;
        emit ClaimAdviserUnLockFunds(amount);
    }

    function claimTeamUnLockFunds() external {
        require(block.timestamp > teamUnLockSec, "team funds still during the lock-up period");
        uint256 amount = TeamLock * teamLockAddr[msg.sender] / PRECISION;
        require(amount > 0, "The address has no locked team funds");
        _mint(msg.sender, amount);
        teamLockAddr[msg.sender] = 0;
        emit ClaimTeamUnLockFunds(amount);
    }

    function setPrivateLockAddr(address[] memory to, uint256[] memory percent) external onlyOwner {
        require(to.length == percent.length, "length error");
        for (uint256 i = 0; i < to.length; i++) {
            privateLockTotalPercent -= privateLockAddr[to[i]];
            privateLockAddr[to[i]] = percent[i];
            privateLockTotalPercent += percent[i];
        }
        require(privateLockTotalPercent <= PRECISION,
                "Too many private funds raised");
    }

    function setAdviserLockAddr(address[] memory to, uint256[] memory percent) external onlyOwner {
        require(to.length == percent.length, "length error");
        for (uint256 i = 0; i < to.length; i++) {
            adviserLockTotalPercent -= adviserLockAddr[to[i]];
            adviserLockAddr[to[i]] = percent[i];
            adviserLockTotalPercent += percent[i];
        }
        require(adviserLockTotalPercent <= PRECISION,
                "Too many adviser funds raised");
    }

    function setTeamLockAddr(address[] memory to, uint256[] memory percent) external onlyOwner {
        require(to.length == percent.length, "length error");
        for (uint256 i = 0; i < to.length; i++) {
            teamLockTotalPercent -= teamLockAddr[to[i]];
            teamLockAddr[to[i]] = percent[i];
            teamLockTotalPercent += percent[i];
        }
        require(teamLockTotalPercent <= PRECISION,
                "Too many team funds raised");
    }
}


