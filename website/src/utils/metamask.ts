import { ethers } from 'ethers'
/**
 * @description 检查是否有有效 Provider
 * @param {}
 * @returns false || provider
 */
const checkProvider = () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  return provider
}

/**
 * 检查是否有 MetaMask
 * @returns {boolean}
 */
const checkInstallMetamask = () => {
  if (window.ethereum) {
    return true
  }
  return false
}

/**
 * @description 判断是否在对应环境的链
 * @param
 * @returns {boolean}
 */
const checkIsExpectChain = () => {
  const { chainId } = window.ethereum
  if (chainId !== import.meta.env.VITE_APP_CHAIN) {
    return false
  }
  return true
}

export async function getConnectedAddr(): Promise<string | null> {
  if (!window.ethereum) {
    return null
  }
  const acts = await window.ethereum.request({
    method: 'eth_accounts',
  })
  if (acts && acts.length > 0) {
    return acts[0]
  }
  return null
}

export function isConnected(): boolean {
  return window.ethereum.isConnected()
}

export { checkProvider, checkIsExpectChain, checkInstallMetamask }
