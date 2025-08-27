/**
 * Data loading utilities for suppressions and annotations
 */

import type { SuppressionData, AnnotationData, SuppressionState } from './types'

export interface LoadDataResult {
  suppressions: string[]
  annotations: AnnotationData[]
}

/**
 * Load suppressions and annotations data from public/data/ files
 * Falls back to empty arrays if files don't exist or can't be loaded
 */
export async function loadData(): Promise<LoadDataResult> {
  const result: LoadDataResult = {
    suppressions: [],
    annotations: []
  }

  try {
    // Try to load suppressions
    const suppressionsResponse = await fetch('/data/suppressions.json')
    if (suppressionsResponse.ok) {
      const suppressionsData = await suppressionsResponse.json()
      if (Array.isArray(suppressionsData)) {
        result.suppressions = suppressionsData
      }
    }
  } catch (error) {
    console.log('No suppressions.json found or failed to load - using empty array')
  }

  try {
    // Try to load annotations
    const annotationsResponse = await fetch('/data/annotations.json')
    if (annotationsResponse.ok) {
      const annotationsData = await annotationsResponse.json()
      if (Array.isArray(annotationsData)) {
        result.annotations = annotationsData
      }
    }
  } catch (error) {
    console.log('No annotations.json found or failed to load - using empty array')
  }

  return result
}

/**
 * Save suppression state to localStorage as fallback
 */
export function saveSuppressionToLocalStorage(contradictionId: string): void {
  try {
    localStorage.setItem(`suppressed:${contradictionId}`, 'true')
  } catch (error) {
    console.warn('Failed to save suppression to localStorage:', error)
  }
}

/**
 * Remove suppression state from localStorage
 */
export function removeSuppressionFromLocalStorage(contradictionId: string): void {
  try {
    localStorage.removeItem(`suppressed:${contradictionId}`)
  } catch (error) {
    console.warn('Failed to remove suppression from localStorage:', error)
  }
}

/**
 * Check if contradiction is suppressed in localStorage
 */
export function isSupressedInLocalStorage(contradictionId: string): boolean {
  try {
    return localStorage.getItem(`suppressed:${contradictionId}`) === 'true'
  } catch (error) {
    return false
  }
}

/**
 * Save annotation to localStorage as fallback
 */
export function saveAnnotationToLocalStorage(contradictionId: string, note: string): void {
  try {
    const annotation: AnnotationData = {
      contradiction_id: contradictionId,
      note,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem(`annotation:${contradictionId}`, JSON.stringify(annotation))
  } catch (error) {
    console.warn('Failed to save annotation to localStorage:', error)
  }
}

/**
 * Get annotation from localStorage
 */
export function getAnnotationFromLocalStorage(contradictionId: string): AnnotationData | null {
  try {
    const item = localStorage.getItem(`annotation:${contradictionId}`)
    return item ? JSON.parse(item) : null
  } catch (error) {
    return null
  }
}

/**
 * Remove annotation from localStorage
 */
export function removeAnnotationFromLocalStorage(contradictionId: string): void {
  try {
    localStorage.removeItem(`annotation:${contradictionId}`)
  } catch (error) {
    console.warn('Failed to remove annotation from localStorage:', error)
  }
}