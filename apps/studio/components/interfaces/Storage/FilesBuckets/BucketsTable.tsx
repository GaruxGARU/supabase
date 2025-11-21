import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useEffect, useRef, type ReactNode } from 'react'

import {
  VirtualizedTable,
  VirtualizedTableBody,
  VirtualizedTableCell,
  VirtualizedTableRow,
} from 'components/ui/VirtualizedTable'
import { Bucket } from 'data/storage/buckets-query'
import { Table, TableBody, TableCell, TableRow } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { BucketTableEmptyState, BucketTableHeader, BucketTableRow } from './BucketTable'

type PaginationProps = {
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
  getPolicyCount: (bucketName: string) => number
  pagination: PaginationProps
}

export const BucketsTable = (props: BucketsTableProps) => {
  const isVirtualized = props.buckets.length > 50
  return isVirtualized ? (
    <BucketsTableVirtualized {...props} />
  ) : (
    <BucketsTableUnvirtualized {...props} />
  )
}

const BucketsTableUnvirtualized = ({
  buckets,
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
  getPolicyCount,
  pagination: { hasMore = false, isLoadingMore = false, onLoadMore },
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  return (
    <Table
      containerProps={{
        containerClassName: 'h-full overflow-auto',
        className: 'overflow-visible',
        outerContainerRef: scrollContainerRef,
      }}
    >
      <BucketTableHeader mode="standard" hasBuckets={buckets.length > 0} />
      <TableBody>
        {showSearchEmptyState ? (
          <BucketTableEmptyState mode="standard" filterString={filterString} />
        ) : (
          buckets.map((bucket) => (
            <BucketTableRow
              mode="standard"
              key={bucket.id}
              bucket={bucket}
              projectRef={projectRef}
              formattedGlobalUploadLimit={formattedGlobalUploadLimit}
              getPolicyCount={getPolicyCount}
            />
          ))
        )}
        <LoadMoreRow
          mode="standard"
          colSpan={6}
          scrollableParent={scrollContainerRef.current}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
        />
      </TableBody>
    </Table>
  )
}

const BucketsTableVirtualized = ({
  buckets,
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
  getPolicyCount,
  pagination: { hasMore = false, isLoadingMore = false, onLoadMore },
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  return (
    <VirtualizedTable
      data={buckets}
      estimateSize={() => 59}
      getItemKey={(bucket) => bucket.id}
      scrollContainerRef={scrollContainerRef}
    >
      <BucketTableHeader mode="virtualized" hasBuckets={buckets.length > 0} />
      <VirtualizedTableBody<Bucket>
        paddingColSpan={5}
        emptyContent={
          showSearchEmptyState ? (
            <BucketTableEmptyState mode="virtualized" filterString={filterString} />
          ) : undefined
        }
        trailingContent={
          <LoadMoreRow
            mode="virtualized"
            colSpan={6}
            scrollableParent={scrollContainerRef.current}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        }
      >
        {(bucket) => (
          <BucketTableRow
            mode="virtualized"
            key={bucket.id}
            bucket={bucket}
            projectRef={projectRef}
            formattedGlobalUploadLimit={formattedGlobalUploadLimit}
            getPolicyCount={getPolicyCount}
          />
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}

type LoadMoreRowProps = {
  mode: 'standard' | 'virtualized'
  colSpan: number
  scrollableParent: HTMLElement | null
} & PaginationProps

const LoadMoreRow = ({
  mode,
  colSpan,
  scrollableParent,

  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: LoadMoreRowProps): ReactNode => {
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 0,
    root: scrollableParent,
    rootMargin: '200px 0px 200px 0px',
  })

  useEffect(() => {
    if (entry?.isIntersecting && hasMore && !isLoadingMore) {
      onLoadMore?.()
    }
  }, [entry?.isIntersecting, hasMore, isLoadingMore, onLoadMore])

  if (!hasMore && !isLoadingMore) return null

  const RowComponent = mode === 'standard' ? TableRow : VirtualizedTableRow
  const CellComponent = mode === 'standard' ? TableCell : VirtualizedTableCell

  return (
    <RowComponent ref={sentinelRef}>
      {Array.from({ length: colSpan }, (_, idx) => (
        <CellComponent key={idx}>
          <ShimmeringLoader className="w-3/4" />
        </CellComponent>
      ))}
    </RowComponent>
  )
}
