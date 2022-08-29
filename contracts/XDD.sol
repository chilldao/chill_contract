// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract XDD is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable {
    uint8 private constant DECIMAL = 18;
    uint256 public constant TotalSupply = 5 * 10 ** 9 * 10 ** DECIMAL; // 5,000,000,000
    uint256 public constant PrivateLock = TotalSupply * 16 / 100; // 16%
    uint256 public constant AdviserLock = TotalSupply * 2 / 100; // 2%
    uint256 public constant TeamLock = TotalSupply * 15 / 100; // 15%

    uint256 public privateUnLockTs;
    uint256 public privateUnLockDuration;
    uint256 public adviserUnLockTs;
    uint256 public adviserUnLockDuration;
    uint256 public teamUnLockTs;
    uint256 public teamUnLockDuration;

    uint256 public constant ONE_HUNDRED_PERCENT = 100000;
    uint256 public privateLockTotalPercent;
    uint256 public adviserLockTotalPercent;
    uint256 public teamLockTotalPercent;
    // addr => percent
    mapping (address=>uint256) public privateLockAddr;
    mapping (address=>uint256) public adviserLockAddr;
    mapping (address=>uint256) public teamLockAddr;
    // addr => claimed token
    mapping (address=>uint256) public privateClaimed;
    mapping (address=>uint256) public adviserClaimed;
    mapping (address=>uint256) public teamClaimed;

    event SetPrivateUnLockTs(uint256 nTs, uint256 nDuration, uint256 oTs, uint256 oDuration);
    event SetAdviserUnLockTs(uint256 nTs, uint256 nDuration, uint256 oTs, uint256 oDuration);
    event SetTeamUnLockTs(uint256 nTs, uint256 nDuration, uint256 oTs, uint256 oDuration);
    event ClaimPrivateUnLockFunds(uint256 amount, uint256 total);
    event ClaimAdviserUnLockFunds(uint256 amount, uint256 total);
    event ClaimTeamUnLockFunds(uint256 amount, uint256 total);

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
        setPrivateUnLockTs(block.timestamp, 31104000); //31104000 = 12 * 30 * 24 * 60 * 60
        setAdviserUnLockTs(block.timestamp, 62208000); //62208000 = 24 * 30 * 24 * 60 * 60
        setTeamUnLockTs(block.timestamp, 62208000);
    }

    function setPrivateUnLockTs(uint256 ts, uint256 duration) public onlyOwner {
        emit SetPrivateUnLockTs(ts, duration, privateUnLockTs, privateUnLockDuration);
        privateUnLockTs = ts;
        privateUnLockDuration = duration;
    }

    function setAdviserUnLockTs(uint256 ts, uint256 duration) public onlyOwner {
        emit SetAdviserUnLockTs(ts, duration, adviserUnLockTs, adviserUnLockDuration);
        adviserUnLockTs = ts;
        adviserUnLockDuration = duration;
    }

    function setTeamUnLockTs(uint256 ts, uint256 duration) public onlyOwner {
        emit SetTeamUnLockTs(ts, duration, teamUnLockTs, teamUnLockDuration);
        teamUnLockTs = ts;
        teamUnLockDuration = duration;
    }

    function queryClaimUnLockFunds(address user) view external returns (uint256, uint256, uint256){
      return (queryClaimPrivateUnLockFunds(user),
              queryclaimAdviserUnLockFunds(user),
              queryclaimTeamUnLockFunds(user));
    }
    function queryPrivateTotalLockFunds(address user) view public returns (uint256){
      return PrivateLock * privateLockAddr[user] / ONE_HUNDRED_PERCENT;
    }
    function queryAdviserTotalLockFunds(address user) view public returns (uint256){
      return AdviserLock * adviserLockAddr[user] / ONE_HUNDRED_PERCENT;
    }
    function queryTeamTotalLockFunds(address user) view public returns (uint256){
      return TeamLock * teamLockAddr[user] / ONE_HUNDRED_PERCENT;
    }
    function queryClaimPrivateUnLockFunds(address user) view public returns (uint256){
      if (block.timestamp <= privateUnLockTs) {
        return 0;
      }
      uint256 duration = block.timestamp - privateUnLockTs;
      if (duration > privateUnLockDuration) {
        duration = privateUnLockDuration;
      }
      return PrivateLock * privateLockAddr[user] * duration /
        privateUnLockDuration / ONE_HUNDRED_PERCENT - privateClaimed[user];
    }
    function queryclaimAdviserUnLockFunds(address user) view public returns (uint256){
      if (block.timestamp <= adviserUnLockTs) {
        return 0;
      }
      uint256 duration = block.timestamp - adviserUnLockTs;
      if (duration > adviserUnLockDuration) {
        duration = adviserUnLockDuration;
      }
      return AdviserLock * adviserLockAddr[user] * duration /
        privateUnLockDuration / ONE_HUNDRED_PERCENT - adviserClaimed[user];
    }
    function queryclaimTeamUnLockFunds(address user) view public returns (uint256){
      if (block.timestamp <= teamUnLockTs) {
        return 0;
      }
      uint256 duration = block.timestamp - teamUnLockTs;
      if (duration > teamUnLockDuration) {
        duration = teamUnLockDuration;
      }
      return TeamLock * teamLockAddr[user] * duration /
        privateUnLockDuration / ONE_HUNDRED_PERCENT - teamClaimed[user];
    }

    function claimPrivateUnLockFunds() external {
        require(block.timestamp > privateUnLockTs, "private funds still during the lock-up period");
        uint256 amount = queryClaimPrivateUnLockFunds(msg.sender);
        require(amount > 0, "The address has no locked private funds");
        _mint(msg.sender, amount);
        privateClaimed[msg.sender] += amount;
        emit ClaimPrivateUnLockFunds(amount, privateClaimed[msg.sender]);
    }

    function claimAdviserUnLockFunds() external {
        require(block.timestamp > adviserUnLockTs, "adviser funds still during the lock-up period");
        uint256 amount = queryclaimAdviserUnLockFunds(msg.sender);
        require(amount > 0, "The address has no locked adviser funds");
        _mint(msg.sender, amount);
        adviserClaimed[msg.sender] += amount;
        emit ClaimAdviserUnLockFunds(amount, adviserClaimed[msg.sender]);
    }

    function claimTeamUnLockFunds() external {
        require(block.timestamp > teamUnLockTs, "team funds still during the lock-up period");
        uint256 amount = queryclaimTeamUnLockFunds(msg.sender);
        require(amount > 0, "The address has no locked team funds");
        _mint(msg.sender, amount);
        teamClaimed[msg.sender] += amount;
        emit ClaimTeamUnLockFunds(amount, teamClaimed[msg.sender]);
    }

    function setPrivateLockAddr(address[] memory to, uint256[] memory percent) external onlyOwner {
        require(to.length == percent.length, "length error");
        for (uint256 i = 0; i < to.length; i++) {
            privateLockTotalPercent -= privateLockAddr[to[i]];
            privateLockAddr[to[i]] = percent[i];
            privateLockTotalPercent += percent[i];
        }
        require(privateLockTotalPercent <= ONE_HUNDRED_PERCENT,
                "Too many private funds raised");
    }

    function setAdviserLockAddr(address[] memory to, uint256[] memory percent) external onlyOwner {
        require(to.length == percent.length, "length error");
        for (uint256 i = 0; i < to.length; i++) {
            adviserLockTotalPercent -= adviserLockAddr[to[i]];
            adviserLockAddr[to[i]] = percent[i];
            adviserLockTotalPercent += percent[i];
        }
        require(adviserLockTotalPercent <= ONE_HUNDRED_PERCENT,
                "Too many adviser funds raised");
    }

    function setTeamLockAddr(address[] memory to, uint256[] memory percent) external onlyOwner {
        require(to.length == percent.length, "length error");
        for (uint256 i = 0; i < to.length; i++) {
            teamLockTotalPercent -= teamLockAddr[to[i]];
            teamLockAddr[to[i]] = percent[i];
            teamLockTotalPercent += percent[i];
        }
        require(teamLockTotalPercent <= ONE_HUNDRED_PERCENT,
                "Too many team funds raised");
    }
}


