/* eslint-disable class-methods-use-this */
import type { Dispatch, ReactElement, SetStateAction } from 'react'
import { useMemo, useEffect, useState, useContext, createContext } from 'react'

// import { getWallet } from '~/wallet'
import { RoleType } from '~/lib/enum'
import type { AccountContextProps, DeschoolProfile, ProfileExtend, LensTokenInfo } from '~/lib/types/app'

export const DEFAULT_AVATAR = 'https://s3.us-east-1.amazonaws.com/deschool/Avatars/avatar_def.png'
export const DEFAULT_AVATAR_NAME = 'avatar_def.png'

export class UserContext {
  lensProfile: ProfileExtend | null

  deschoolProfile: DeschoolProfile | null

  lensToken: LensTokenInfo | null

  setLensProfile: Dispatch<SetStateAction<ProfileExtend | null>>

  setDescoolProfile: Dispatch<SetStateAction<DeschoolProfile | null>>

  setLensToken: Dispatch<SetStateAction<LensTokenInfo | null>>

  constructor(accountMemo: AccountContextProps) {
    this.lensProfile = accountMemo.lensProfile
    this.deschoolProfile = accountMemo.deschoolProfile
    this.lensToken = accountMemo.lensToken
    this.setLensProfile = accountMemo.setLensProfile
    this.setDescoolProfile = accountMemo.setDescoolProfile
    this.setLensToken = accountMemo.setLensToken
  }

  // 设置当前lens账号默认的profile
  changeUserProfile(info: ProfileExtend) {
    this.setLensProfile(info)
  }

  // 断开lens的连接
  disconnectFromLens = (): void => {
    this.setLensProfile(null)
    this.setLensToken(null)
    localStorage.removeItem('lensProfile')
    localStorage.removeItem('lensToken')
  }

  // 断开deschool的连接
  disconnectFromDeschool = (): void => {
    this.setDescoolProfile(null)
    localStorage.removeItem('deschoolProfile')
  }

  // 根据登录情况，获取登录角色
  getLoginRoles = () => {
    // Visitor: deschool token和lens token都不存在
    // UserWithHandle: lens token存在并且 profile handle存在
    // UserWithoutHandle: lens token存在并且 profile handle不存在
    // UserOfDeschool: deschool token存在
    const roles = [] as RoleType[]
    if (!this.deschoolProfile && !this.lensToken) {
      roles.push(RoleType.Visitor)
    }
    if (this.lensToken && this.lensProfile?.handle) {
      roles.push(RoleType.UserOfLens)
    }
    if (this.deschoolProfile) {
      roles.push(RoleType.UserOfDeschool)
    }
    return roles
  }
}

export const AccountContext = createContext<AccountContextProps>({
  lensProfile: null,
  deschoolProfile: null,
  lensToken: null,
  setLensProfile: () => {},
  setDescoolProfile: () => {},
  setLensToken: () => {},
})

const getStorage = (type: string) => {
  const item = localStorage.getItem(type)
  if (item) {
    return JSON.parse(item)
  }
  return null
}

// eslint-disable-next-line import/no-mutable-exports
let userContext: UserContext = new UserContext({
  lensProfile: null,
  deschoolProfile: null,
  lensToken: null,
  setLensProfile: () => {},
  setDescoolProfile: () => {},
  setLensToken: () => {},
})

export const AccountContextProvider = ({ children }: { children: ReactElement }) => {
  const [lensProfile, setLensProfile] = useState<ProfileExtend | null>(getStorage('lensProfile'))
  const [deschoolProfile, setDescoolProfile] = useState<DeschoolProfile | null>(getStorage('deschoolProfile'))
  const [lensToken, setLensToken] = useState<LensTokenInfo | null>(getStorage('lensToken'))

  const accountMemo = useMemo(
    () => ({
      lensProfile,
      deschoolProfile,
      lensToken,
      setLensProfile,
      setDescoolProfile,
      setLensToken,
    }),
    [lensProfile, deschoolProfile, lensToken],
  )

  useEffect(() => {
    if (lensProfile) {
      localStorage.setItem('lensProfile', JSON.stringify(lensProfile))
    } else {
      localStorage.removeItem('lensProfile')
    }
  }, [lensProfile])

  useEffect(() => {
    if (deschoolProfile) {
      localStorage.setItem('deschoolProfile', JSON.stringify(deschoolProfile))
    } else {
      localStorage.removeItem('deschoolProfile')
    }
  }, [deschoolProfile])

  useEffect(() => {
    if (lensToken) {
      localStorage.setItem('lensToken', JSON.stringify(lensToken))
    } else {
      localStorage.removeItem('lensToken')
    }
  }, [lensToken])

  userContext = new UserContext({ lensProfile, deschoolProfile, lensToken, setLensProfile, setDescoolProfile, setLensToken })

  return <AccountContext.Provider value={accountMemo}>{children}</AccountContext.Provider>
}

export const useAccount = () => {
  const account = useContext(AccountContext)
  return account
}

export const getUserContext = () => userContext
