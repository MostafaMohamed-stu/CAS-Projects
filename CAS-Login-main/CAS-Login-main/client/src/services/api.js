const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const TOKEN_KEYS = {
  SSO: 'cas_sso_token',
  JWT: 'cas_jwt_token',
  USER: 'cas_user_info',
}

export const tokenStorage = {
  getSsoToken: () => localStorage.getItem(TOKEN_KEYS.SSO),
  getJwtToken: () => localStorage.getItem(TOKEN_KEYS.JWT),
  getUser: () => {
    try {
      const raw = localStorage.getItem(TOKEN_KEYS.USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  saveSession: (data) => {
    if (data?.ssoToken || data?.SsoToken) localStorage.setItem(TOKEN_KEYS.SSO, data.ssoToken || data.SsoToken)
    if (data?.jwtToken || data?.JwtToken) localStorage.setItem(TOKEN_KEYS.JWT, data.jwtToken || data.JwtToken)

    const userInfo = {
      accountId: data?.accountId || data?.AccountId,
      email: data?.email || data?.Email,
      fullNameEn: data?.fullNameEn || data?.FullNameEn,
      fullNameAr: data?.fullNameAr || data?.FullNameAr,
      role: data?.role || data?.Role,
      businessEntityName: data?.businessEntityName || data?.BusinessEntityName,
      ssoExpiresAt: data?.ssoExpiresAt || data?.SsoExpiresAt,
      jwtExpiresAt: data?.jwtExpiresAt || data?.JwtExpiresAt,
    }
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userInfo))
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEYS.SSO)
    localStorage.removeItem(TOKEN_KEYS.JWT)
    localStorage.removeItem(TOKEN_KEYS.USER)
  },
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const jwt = tokenStorage.getJwtToken() || tokenStorage.getSsoToken()
  if (jwt && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${jwt}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const responseData = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      responseData?.message ||
      responseData?.title ||
      responseData?.errors?.[0] ||
      `Request failed with status ${response.status}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = responseData
    throw error
  }

  return responseData
}

export const authApi = {
  login: async (email, password, businessEntityName = 'Default', businessEntityId = null) => {
    // If a numeric businessEntityId was provided (e.g., from the Attendance app), use it.
    // Otherwise fall back to sending the name for backwards compatibility.
    const payload = businessEntityId
      ? { email, password, businessEntityId }
      : { email, password, businessEntityName }
    const result = await request('/Auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result?.data) {
      tokenStorage.saveSession(result.data)
    }

    return result
  },

  exchangeToken: async (businessEntityName, businessEntityId = null) => {
    const ssoToken = tokenStorage.getSsoToken()
    // The switch endpoint requires a numeric BusinessEntityId
    const payload = businessEntityId
      ? { businessEntityId }
      : { businessEntityName }
    const result = await request('/Auth/switch', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: ssoToken ? { 'Authorization': `Bearer ${ssoToken}` } : {},
    })
    if (result?.data?.jwtToken) {
      localStorage.setItem(TOKEN_KEYS.JWT, result.data.jwtToken)
    }
    return result
  },

  validateToken: async () => {
    return await request('/Auth/validate', {
      method: 'POST',
    })
  },

  getBusinessEntities: async () => {
    return await request('/BusinessEntity', {
      method: 'GET',
    })
  },

  getMyBusinessEntities: async () => {
    return await request('/BusinessEntity/my-entities', {
      method: 'GET',
    })
  },
}
