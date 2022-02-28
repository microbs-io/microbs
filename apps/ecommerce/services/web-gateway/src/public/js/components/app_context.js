// Third-party packages
import React, { createContext, useState, useEffect } from 'react'

// Main packages
import * as api from '../api'

export const AppContext = createContext()

export const Provider = (props) => {

  const [loading, setLoading] = useState(false)

  /*
  cart = {
    size: INTEGER,
    subtotal: INTEGER,
    items: [
      {
        id: STRING,
        quantity: INTEGER,
        product: OBJECT
      }
    ]
  }
  */
  const [cart, setCart] = useState({
    size: null,
    subtotal: null,
    items: null
  })

  /**
   * Get cart data.
   */
  const refreshCart = async () => {
    const cartRes = await api.cartGet()
    const quantities = cartRes.data.data
    const productIds = Object.keys(quantities || {})
    if (!productIds.length) {
      setCart(cart => ({
        size: 0,
        subtotal: 0.0,
        items: []
      }))
      return
    }
    const items = []
    var size = 0
    var subtotal = 0.0
    const prodRes = await api.productDocuments(productIds)
    console.log(prodRes)
    const prodData = prodRes.data || []
    for (var i in prodData) {
      let product = prodData[i]
      size = size + parseInt(quantities[product.id])
      subtotal = subtotal + (parseFloat(product.price) * parseFloat(quantities[product.id]))
      items.push({
        id: product.id,
        quantity: parseInt(cartRes.data.data[product.id]),
        product: product
      })
    }
    setCart(cart => ({
      size: size,
      subtotal: subtotal,
      items: items
    }))
  }

  /**
   * Determine whether a product ID exists in a cart
   */
  const cartHas = (productId) => {
    for (var i in (cart.items || []))
      if (cart.items[i].id == productId && cart.items[i].quantity > 0)
        return true
    return false
  }

  /**
   * Refresh cart on page load.
   */
  useEffect(() => {
    if (cart.items === null) {
      setLoading(true)
      try {
        refreshCart()
      } finally {
        setLoading(false)
      }
    }
  }, [])

  return (
    <AppContext.Provider value={{
        cart, setCart, refreshCart, cartHas,
        loading, setLoading,
      }}>
      {props.children}
    </AppContext.Provider>
  )
}
