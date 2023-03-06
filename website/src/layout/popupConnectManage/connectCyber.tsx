import MetaMaskImage from '~/assets/logos/mask.png'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import message from 'antd/es/message'
import CloseOutlined from '@ant-design/icons/CloseOutlined'
import LoadingOutlined from '@ant-design/icons/LoadingOutlined'
import { RoleType } from '~/lib/enum'

import { getUserContext, useAccount } from '~/context/account'
import type { WalletConfig } from '~/wallet'
import { createProvider, getWallet, WalletType } from '~/wallet'
import { LOGIN_GET_MESSAGE, LOGIN_VERIFY, PRIMARY_PROFILE } from '~/api/cc/graphql'
import { useLazyQuery, useMutation } from '@apollo/client'
import IconCyberConnect from '~/assets/icons/cyberConnect.svg'
import IconCyberConnectLogo from '~/assets/icons/cyberconnectLogo.svg'
import Button from 'antd/es/button'
import { PlatformType } from '~/api/booth/booth'
import { linkPlatform } from '~/api/booth/account'

const DOMAIN = 'test.com'
interface ConnectBoardProps {
  wallectConfig?: WalletConfig
  connectTrigger?: any
}

const ConnectCyberBoard: FC<ConnectBoardProps> = props => {
  const { connectTrigger } = props
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const { cyberProfile, setCyberToken, setCyberProfile } = useAccount()
  const [loginGetMessage] = useMutation(LOGIN_GET_MESSAGE);
  const [loginVerify] = useMutation(LOGIN_VERIFY);
  const [getPrimaryProfile] = useLazyQuery(PRIMARY_PROFILE);

  /**
   * @description 连接失败的异常处理
   * @param {}
   * @returns {}
   */
  const handleFailToConnect = (err: any) => {
    if (err?.code) {
      message.error(t(`${err.code}`))
    } else {
      message.error(err?.toString() || err)
    }
  }

  // 对传入的challenge信息签名并返回签名结果
  const signLoginMessage = async (challengeText: string) => {
    const SIGN_MESSAGE = challengeText
    const signMessageReturn = await getWallet().signMessage(SIGN_MESSAGE)
    return signMessageReturn
  }

  // 通过 cyberconnect 签名登录
  const handleLoginByAddress = async (address: string, isReload?: boolean) => {
    // 如果当前库中已经保存过登录记录则不需要重新签名登录
    const roles = getUserContext().getLoginRoles()
    if (roles.includes(RoleType.UserOfCyber)) {
      return
    }
    try {
      // // 根据钱包地址查用户profile信息
      const res = await getPrimaryProfile({
				variables: {
					address,
				},
			});
      const userInfo = res?.data?.address?.wallet?.primaryProfile
      // 没handle,则 ccProfile为空
      if (!userInfo) {
        console.log('no handle')
        setCyberProfile(null)
        setCyberToken(null)
        message.info({
          key: 'nohandle',
          content: (
            <p className="inline">
              Visit
              <a className="font-bold mx-2" href={import.meta.env.VITE_APP_CYBERCONNECT_CLAIM_SITE} target="_blank" rel="noreferrer noopener">
                claiming site
              </a>
              to claim your profile now 🏃‍♂️
              <CloseOutlined
                size={12}
                className="inline ml-2 hover:color-purple!"
                onClick={() => {
                  message.destroy('nohandle')
                }}
              />
            </p>
          ),
          duration: 0,
        })
        return
      }
      // 有handle,更新default profile
      const messageResult = await loginGetMessage({
        variables: {
          input: {
            address,
            domain: DOMAIN,
          },
        },
      });
      const messagetext = messageResult?.data?.loginGetMessage?.message;

      // sign the challenge text with the wallet
      const signature = await signLoginMessage(messagetext)

      // check signature
      const accessTokenResult = await loginVerify({
        variables: {
          input: {
            address,
            domain: DOMAIN,
            signature: signature,
          },
        },
      })

      const accessToken = accessTokenResult?.data?.loginVerify?.accessToken;

      if (!signature) return

      setCyberToken({
        address,
        accessToken: accessToken,
      })
      // // 根据钱包地址查用户profile信息
      // 需要在这里处理一下handle，因为cyber的handle是带有.cc的
      userInfo.handleStr = userInfo?.handle
      userInfo.handle = userInfo?.handle?.split('.cc')[0]
      setCyberProfile(userInfo)
      // 关联平台
      const result = await linkPlatform({
        handle: userInfo?.handle,
        platform: PlatformType.CYBERCONNECT,
      })
      console.log('linkPlatform', result)
    } catch (error: any) {
      if (error?.reason) {
        message.error(error.reason)
      } else if (error?.name && error?.message) {
        message.error(`${error.name}: ${error.message}`)
      } else if (error?.code && error?.message) {
        message.error(`${error.name}: ${error.message}`)
      } else {
        message.error(String(error))
      }
    } finally {
      if (isReload) window.location.reload()
    }
  }

  /**
   * 链接小狐狸钱包
   * @returns
   */
  const handleConnect = async () => {
    if (loading) return
    setLoading(true)
    try {
      // 初始化小狐狸钱包并获取地址
      const config = { ...props.wallectConfig, type: WalletType.MetaMask }
      const provider = createProvider(config)
      await getWallet().setProvider(WalletType.MetaMask, provider)
      const address = await getWallet().getAddress()
      if (address) {
        await handleLoginByAddress(address)
      } else {
        message.error("Can't get address info, please connect metamask first")
      }
    } catch (err: any) {
      handleFailToConnect(err)
    } finally {
      setLoading(false)
    }
  }


  // 退出 CyberConnect 登录
  const handleDisconnect = async () => {
    try {
      getUserContext().disconnectFromCyberConnect()
    } catch (error: any) {
      message.error(error?.message ? error.message : '退出登录失败')
    }
  }

  useEffect(() => {
    if (connectTrigger) {
      handleLoginByAddress(connectTrigger, true)
    }
  }, [connectTrigger])

  return (
    <div className="fcc-between w-full min-h-360px p-4 rounded-lg shadow">
      <div className='fcs-start w-full'>
        <div className="bg-black rounded-2 px-2 py-2 frc-start">
          <img src={IconCyberConnectLogo} alt="cyberconnect" />
        </div>
        {cyberProfile && <div className="frc-start mt-4">
          <div className="bg-black rounded-50% w-28px h-28px frc-center">
            <img src={IconCyberConnect} alt="cyberconnect" width={20} height={20} />
          </div>
          <span className='ml-2'>{cyberProfile.handleStr}</span>
        </div>}
      </div>
      <div className="flex flex-row w-full items-center justify-center">
        <Button
          onClick={e => {
            e.preventDefault()
            cyberProfile ? handleDisconnect() : handleConnect()
          }}
          className="w-full h-12 border border-solid border-#6525FF bg-white hover:border-#6525FF66 hover:bg-#6525FF22"
          disabled={loading}
        >
          {!cyberProfile ? (<div className="text-#6525FF text-[16px] w-full frc-between">
            <div className="frc-start">
              <span className='mr-2'>CONNECT</span>
              {loading && (
                <LoadingOutlined color="#6525FF"/>
              )}
            </div>
            <img alt="mask" src={MetaMaskImage} style={{ width: '25px', height: '25px' }} />
          </div>) :
          (<div className="text-#6525FF text-[16px] w-full frc-center">
            DISCONNECT
          </div>)}
        </Button>
      </div>
    </div>
  )
}

export default ConnectCyberBoard
