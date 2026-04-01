// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VRFConsumer.sol";

/// @dev Concrete implementation for testing
contract MockVRFConsumer is VRFConsumer {
    uint256[] public lastRandomWords;
    uint256 public lastRequestId;

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    )
        VRFConsumer(
            _vrfCoordinator,
            _keyHash,
            _subscriptionId,
            _callbackGasLimit,
            _requestConfirmations
        )
    {}

    function requestRandom(uint32 numWords) external returns (uint256) {
        return _requestRandomness(numWords);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        lastRequestId = requestId;
        delete lastRandomWords;
        for (uint256 i = 0; i < randomWords.length; i++) {
            lastRandomWords.push(randomWords[i]);
        }
        requestFulfilled[requestId] = true;
        emit RandomnessFulfilled(requestId);
    }
}

contract VRFConsumerTest is Test {
    MockVRFConsumer public consumer;
    address public vrfCoordinator;
    bytes32 public keyHash = keccak256("keyHash");
    uint256 public subId = 1;

    function setUp() public {
        vrfCoordinator = makeAddr("vrfCoordinator");

        consumer = new MockVRFConsumer(
            vrfCoordinator,
            keyHash,
            subId,
            200_000,
            3
        );
    }

    function test_Constructor() public view {
        assertEq(consumer.keyHash(), keyHash);
        assertEq(consumer.subscriptionId(), subId);
        assertEq(consumer.callbackGasLimit(), 200_000);
        assertEq(consumer.requestConfirmations(), 3);
    }

    function test_FulfillRandomWords() public {
        // Simulate a VRF callback
        uint256 requestId = 42;
        uint256[] memory words = new uint256[](1);
        words[0] = 12345;

        // Call rawFulfillRandomWords from coordinator
        vm.prank(vrfCoordinator);
        consumer.rawFulfillRandomWords(requestId, words);

        assertTrue(consumer.requestFulfilled(requestId));
        assertEq(consumer.lastRequestId(), requestId);
    }

    function test_RawFulfillRevertsNotCoordinator() public {
        uint256[] memory words = new uint256[](1);
        words[0] = 12345;

        vm.prank(makeAddr("notCoordinator"));
        vm.expectRevert();
        consumer.rawFulfillRandomWords(42, words);
    }
}
