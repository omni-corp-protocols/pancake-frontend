import { request, gql } from 'graphql-request'
import { INFO_CLIENT } from 'config/constants/endpoints'
import { TOKEN_BLACKLIST } from 'config/constants/info'

/**
 * Data for showing Pools table on the Token page
 */
const POOLS_FOR_TOKEN = gql`
  query poolsForToken($address: Bytes!, $blacklist: [String!]) {
    asToken0: curves(
      first: 15
      orderBy: trackedReserveNative
      orderDirection: desc
      where: { txCount_gt: 100, token0: $address, token1_not_in: $blacklist }
    ) {
      id
    }
    asToken1: pairs(
      first: 15
      orderBy: trackedReserveNative
      orderDirection: desc
      where: { txCount_gt: 100, token1: $address, token0_not_in: $blacklist }
    ) {
      id
    }
  }
`

interface PoolsForTokenResponse {
  asToken0: {
    id: string
  }[]
  asToken1: {
    id: string
  }[]
}

const fetchPoolsForToken = async (
  address: string,
): Promise<{
  error: boolean
  addresses?: string[]
}> => {
  try {
    const data = await request<PoolsForTokenResponse>(INFO_CLIENT, POOLS_FOR_TOKEN, {
      address,
      blacklist: TOKEN_BLACKLIST,
    })
    return {
      error: false,
      addresses: data.asToken0.concat(data.asToken1).map((p) => p.id),
    }
  } catch (error) {
    console.error(`Failed to fetch pools for token ${address}`, error)
    return {
      error: true,
    }
  }
}

export default fetchPoolsForToken
