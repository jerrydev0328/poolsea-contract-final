const { web3 } = require('hardhat')
const { strip0x } = require('../../helpers/utils')
const { ecSign } = require('../../helpers/signatures')

const transferWithAuthorizationTypeHash = web3.utils.keccak256(
  'TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)'
)

const permitTypeHash = web3.utils.keccak256(
  'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
)

function signTransferAuthorization(from, to, value, validAfter, validBefore, nonce, domainSeparator, privateKey) {
  const digest = calculateTransferAuthorizationDigest(from, to, value, validAfter, validBefore, nonce, domainSeparator)
  return ecSign(digest, privateKey)
}

function signPermit(owner, spender, value, nonce, deadline, domainSeparator, privateKey) {
  const digest = calculatePermitDigest(owner, spender, value, nonce, deadline, domainSeparator)
  return ecSign(digest, privateKey)
}

function calculatePermitDigest(owner, spender, value, nonce, deadline, domainSeparator) {
  return calculateEIP712Digest(
    domainSeparator,
    permitTypeHash,
    ['address', 'address', 'uint256', 'uint256', 'uint256'],
    [owner, spender, value, nonce, deadline]
  )
}

function calculateTransferAuthorizationDigest(from, to, value, validAfter, validBefore, nonce, domainSeparator) {
  return calculateEIP712Digest(
    domainSeparator,
    transferWithAuthorizationTypeHash,
    ['address', 'address', 'uint256', 'uint256', 'uint256', 'bytes32'],
    [from, to, value, validAfter, validBefore, nonce]
  )
}

function calculateEIP712Digest(domainSeparator, typeHash, types, parameters) {
  return web3.utils.keccak256(
    '0x1901' +
      strip0x(domainSeparator) +
      strip0x(web3.utils.keccak256(web3.eth.abi.encodeParameters(['bytes32', ...types], [typeHash, ...parameters])))
  )
}

function makeDomainSeparator(name, version, chainId, verifyingContract) {
  return web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        web3.utils.keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
        web3.utils.keccak256(name),
        web3.utils.keccak256(version),
        chainId,
        verifyingContract,
      ]
    )
  )
}

module.exports = {
  signPermit,
  permitTypeHash,
  signTransferAuthorization,
  makeDomainSeparator,
  calculatePermitDigest,
  calculateTransferAuthorizationDigest,
}
