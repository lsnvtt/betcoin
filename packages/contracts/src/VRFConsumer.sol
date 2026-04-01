// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/// @title VRFConsumer
/// @notice Abstract base contract for Chainlink VRF V2.5 consumers
/// @dev Subcontracts must implement fulfillRandomWords
abstract contract VRFConsumer is VRFConsumerBaseV2Plus {
    /// @notice VRF key hash
    bytes32 public keyHash;

    /// @notice VRF subscription ID
    uint256 public subscriptionId;

    /// @notice Callback gas limit for VRF response
    uint32 public callbackGasLimit;

    /// @notice Number of confirmations before VRF response
    uint16 public requestConfirmations;

    /// @notice Mapping from requestId to whether it has been fulfilled
    mapping(uint256 => bool) public requestFulfilled;

    /// @notice Mapping from requestId to the requester
    mapping(uint256 => address) public requestSender;

    // --- Events ---

    event RandomnessRequested(uint256 indexed requestId, address indexed sender);
    event RandomnessFulfilled(uint256 indexed requestId);

    // --- Errors ---

    error RequestNotFound();
    error RequestAlreadyFulfilled();

    /// @param _vrfCoordinator VRF Coordinator address
    /// @param _keyHash VRF key hash
    /// @param _subscriptionId VRF subscription ID
    /// @param _callbackGasLimit Gas limit for the callback
    /// @param _requestConfirmations Number of confirmations
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
    }

    /// @notice Request random words from VRF
    /// @param numWords Number of random words to request
    /// @return requestId The VRF request ID
    function _requestRandomness(uint32 numWords) internal returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        requestSender[requestId] = msg.sender;
        emit RandomnessRequested(requestId, msg.sender);
    }
}
