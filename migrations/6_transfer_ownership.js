const CodexTitle = artifacts.require('./CodexTitle.sol')
const CodexTitleProxy = artifacts.require('./CodexTitleProxy.sol')

module.exports = async (deployer, network, accounts) => {

  deployer
    .then(async () => {
      let newOwner

      // The owner key should be stored securely in cold storage.
      switch (network) {
        case 'develop':
        case 'coverage':
          return

        case 'ganache':
          newOwner = accounts[1]
          break

        case 'rinkeby':
          newOwner = '0xA7899114e93880A5790a68F9df66174FC038849a'
          break

        default:
          throw new Error('No ownership transfer defined for this network')
      }

      // Transfer ownership of CodexTitle from the perspective of CodexTitleProxy.
      // Initialization of this storage slot has already taken place earlier in migration
      //  because some operations (like setting the tokenURI) require owner permissions.
      const codexTitleProxy = await CodexTitleProxy.deployed()
      const proxiedCodexTitle = CodexTitle.at(codexTitleProxy.address)
      await proxiedCodexTitle.transferOwnership(newOwner)

      // For security, let's initialize the ownership of CodexTitle to newOwner as well.
      // This is a defensive action because no one should ever be interacting with CodexTitle
      //  directly, they should always be going through CodexTitleProxy.
      const codexTitle = await CodexTitle.deployed()
      await codexTitle.initializeOwnable(newOwner)

      // Finally, transfer ownership of CodexTitleProxy from deployer to newOwner.
      // This is a crucial step in the process because the owner of CodexTitleProxy is the one
      //  that dictates future upgrades.
      codexTitleProxy.transferOwnership(newOwner)
    })
    .catch((error) => {
      console.log(error)
    })
}
