import { createClient } from '@supabase/supabase-js'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    limit: queryLimit,
    offset: queryOffset,
    search: querySearch,
    sortColumn: querySortColumn,
    sortOrder: querySortOrder,
  } = req.query

  const limit = queryLimit
    ? Array.isArray(queryLimit)
      ? parseInt(queryLimit[0], 10)
      : parseInt(queryLimit, 10)
    : undefined
  const offset = queryOffset
    ? Array.isArray(queryOffset)
      ? parseInt(queryOffset[0], 10)
      : parseInt(queryOffset, 10)
    : undefined
  const search = querySearch
    ? Array.isArray(querySearch)
      ? querySearch[0]
      : querySearch
    : undefined
  const sortColumnString = querySortColumn
    ? Array.isArray(querySortColumn)
      ? querySortColumn[0]
      : querySortColumn
    : undefined
  const sortColumn = ['id', 'created_at', 'name'].includes(sortColumnString || '')
    ? (sortColumnString as 'id' | 'created_at' | 'name')
    : undefined
  const sortOrderString = querySortOrder
    ? Array.isArray(querySortOrder)
      ? querySortOrder[0]
      : querySortOrder
    : undefined
  const sortOrder = ['asc', 'desc'].includes(sortOrderString || '')
    ? (sortOrderString as 'asc' | 'desc')
    : undefined

  const { data, error } = await supabase.storage.listBuckets({
    ...(limit ? { limit } : {}),
    ...(offset ? { offset } : {}),
    ...(search ? { search } : {}),
    ...(sortColumn ? { sortColumn } : {}),
    ...(sortOrder ? { sortOrder } : {}),
  })
  if (error) {
    return res.status(500).json({ error: { message: 'Internal Server Error' } })
  }

  return res.status(200).json(data)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    id,
    public: isPublicBucket,
    allowed_mime_types: allowedMimeTypes,
    file_size_limit: fileSizeLimit,
  } = req.body

  const { data, error } = await supabase.storage.createBucket(id, {
    public: isPublicBucket,
    allowedMimeTypes,
    fileSizeLimit,
  })
  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  return res.status(200).json(data)
}
