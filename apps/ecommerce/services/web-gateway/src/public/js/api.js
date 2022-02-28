// Third-party packages
import axios from 'axios'
import Cookies from 'js-cookie'

const getSessionId = () => decodeURIComponent(Cookies.get('session_id'))

export const healthz = async () => {
  return await axios.request({
    method: 'get',
    url: '/healthz',
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

////  Main Routes  /////////////////////////////////////////////////////////////

export const cartGet = async () => {
  return await axios.request({
    method: 'post',
    url: '/api/v1/cart',
    data: {
      session_id: getSessionId()
    },
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const cartItemGet = async (productId) => {
  return await axios.request({
    method: 'get',
    url: `/api/v1/cart/${productId}`,
    data: {
      session_id: getSessionId()
    },
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const cartItemAdd = async (productId, quantity) => {
  return await axios.request({
    method: 'put',
    url: `/api/v1/cart/${productId}/${quantity}`,
    data: {
      session_id: getSessionId()
    },
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const cartItemRemove = async (productId) => {
  return await axios.request({
    method: 'delete',
    url: `/api/v1/cart/${productId}`,
    data: {
      session_id: getSessionId()
    },
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const checkout = async (data) => {
  data.session_id = getSessionId()
  return await axios.request({
    method: 'post',
    url: '/api/v1/checkout/process',
    data: data,
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const productDocuments = async (ids) => {
  return await axios.request({
    method: 'post',
    url: '/api/v1/product/documents',
    data: ids,
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const productSearch = async (data) => {
  return await axios.request({
    method: 'post',
    url: '/api/v1/product/search',
    data: data,
    timeout: 4000,
    validateStatus: (status) => true,
  })
}

export const productSuggestions = async (data) => {
  return await axios.request({
    method: 'post',
    url: '/api/v1/product/suggestions',
    data: data,
    timeout: 4000,
    validateStatus: (status) => true,
  })
}
