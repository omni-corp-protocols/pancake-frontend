import { useBlocksFromTimestamps } from 'views/Info/hooks/useBlocksFromTimestamps'
import { getDeltaTimestamps } from 'views/Info/utils/infoQueryHelpers'
import { useState, useEffect } from 'react'
import { request, gql } from 'graphql-request'
import { INFO_CLIENT } from 'config/constants/endpoints'

export interface BnbPrices {
  current: number
  oneDay: number
  twoDay: number
  week: number
}

const BNB_PRICES = gql`
  query prices($block24: Int!, $block48: Int!, $blockWeek: Int!) {
    current: bundle(id: "1") {
      nativePrice
    }
    oneDay: bundle(id: "1", block: { number: $block24 }) {
      nativePrice
    }
    twoDay: bundle(id: "1", block: { number: $block48 }) {
      nativePrice
    }
    oneWeek: bundle(id: "1", block: { number: $blockWeek }) {
      nativePrice
    }
  }
`

interface PricesResponse {
  current: {
    nativePrice: string
  }
  oneDay: {
    nativePrice: string
  }
  twoDay: {
    nativePrice: string
  }
  oneWeek: {
    nativePrice: string
  }
}

const fetchBnbPrices = async (
  block24: number,
  block48: number,
  blockWeek: number,
): Promise<{ bnbPrices: BnbPrices | undefined; error: boolean }> => {
  try {
    const data = await request<PricesResponse>(INFO_CLIENT, BNB_PRICES, {
      block24,
      block48,
      blockWeek,
    })
    return {
      error: false,
      bnbPrices: {
        current: parseFloat(data.current?.nativePrice ?? '0'),
        oneDay: parseFloat(data.oneDay?.nativePrice ?? '0'),
        twoDay: parseFloat(data.twoDay?.nativePrice ?? '0'),
        week: parseFloat(data.oneWeek?.nativePrice ?? '0'),
      },
    }
  } catch (error) {
    console.error('Failed to fetch BNB prices', error)
    return {
      error: true,
      bnbPrices: undefined,
    }
  }
}

/**
 * Returns BNB prices at current, 24h, 48h, and 7d intervals
 */
export const useBnbPrices = (): BnbPrices | undefined => {
  const [prices, setPrices] = useState<BnbPrices | undefined>()
  const [error, setError] = useState(false)

  const [t24, t48, tWeek] = getDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])

  useEffect(() => {
    const fetch = async () => {
      const [block24, block48, blockWeek] = blocks
      const { bnbPrices, error: fetchError } = await fetchBnbPrices(block24.number, block48.number, blockWeek.number)
      if (fetchError) {
        setError(true)
      } else {
        setPrices(bnbPrices)
      }
    }
    if (!prices && !error && blocks && !blockError) {
      fetch()
    }
  }, [error, prices, blocks, blockError])

  return prices
}
