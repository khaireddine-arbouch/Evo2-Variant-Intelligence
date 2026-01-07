// Sequence caching system to avoid redundant API calls

interface CachedSequence {
  sequence: string
  start: number
  end: number
  timestamp: number
}

class SequenceCache {
  private cache: Map<string, CachedSequence> = new Map()
  private readonly MAX_CACHE_SIZE = 50 // Maximum number of cached sequences
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(chromosome: string, start: number, end: number, assembly: string): string {
    return `${assembly}:${chromosome}:${start}:${end}`
  }

  get(chromosome: string, start: number, end: number, assembly: string): string | null {
    const key = this.getCacheKey(chromosome, start, end, assembly)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return cached.sequence
  }

  set(chromosome: string, start: number, end: number, assembly: string, sequence: string): void {
    const key = this.getCacheKey(chromosome, start, end, assembly)
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0]
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    this.cache.set(key, {
      sequence,
      start,
      end,
      timestamp: Date.now(),
    })
  }

  // Check if we have overlapping cached data
  getOverlapping(chromosome: string, start: number, end: number, assembly: string): string | null {
    for (const [key, cached] of this.cache.entries()) {
      if (!key.startsWith(`${assembly}:${chromosome}:`)) continue
      
      // Check if cached range overlaps with requested range
      if (cached.start <= end && cached.end >= start) {
        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
          this.cache.delete(key)
          continue
        }
        
        // Return the overlapping portion
        const overlapStart = Math.max(cached.start, start)
        const overlapEnd = Math.min(cached.end, end)
        
        if (overlapStart < overlapEnd) {
          const offset = overlapStart - cached.start
          const length = overlapEnd - overlapStart
          return cached.sequence.slice(offset, offset + length)
        }
      }
    }
    
    return null
  }

  clear(): void {
    this.cache.clear()
  }
}

export const sequenceCache = new SequenceCache()

