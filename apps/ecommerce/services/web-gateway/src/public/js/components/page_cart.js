// Third-party packages
import React, { useContext } from 'react'
import {
  Button,
  Card,
  Container,
  Header,
  Icon,
  Item,
  Grid,
  Menu,
  Placeholder,
  Segment,
} from 'semantic-ui-react'

// Main packages
import * as api from '../api'
import { AppContext } from './app_context'
import SectionFooter from './section_footer'
import SectionHeader from './section_header'
import SectionTitle from './section_title'

const CartPage = () => {

  // Global app state
  const app = useContext(AppContext)

  var title = 'Your Cart'
  var subtitle = ''

  const onAddQuantity = async (e) => {
    e.stopPropagation()
    app.setLoading(true)
    try {
      const productId = e.currentTarget.getAttribute('data-product-id')
      const quantity = parseInt(e.currentTarget.getAttribute('data-quantity')) || 0
      const quantityNew = quantity + 1
      const response = await api.cartItemAdd(productId, quantityNew)
      console.log(response)
      await app.refreshCart()
    } finally {
      app.setLoading(false)
    }
  }

  const onSubtractQuantity = async (e) => {
    e.stopPropagation()
    app.setLoading(true)
    try {
      const productId = e.currentTarget.getAttribute('data-product-id')
      const quantity = parseInt(e.currentTarget.getAttribute('data-quantity')) || 0
      const quantityNew = quantity === 0 ? 0 : quantity - 1
      const response = await api.cartItemAdd(productId, quantityNew)
      console.log(response)
      await app.refreshCart()
    } finally {
      app.setLoading(false)
    }
  }

  const onRemoveItem = async (e) => {
    e.stopPropagation()
    app.setLoading(true)
    try {
      const productId = e.currentTarget.getAttribute('data-product-id')
      const response = await api.cartItemRemove(productId)
      console.log(response)
      await app.refreshCart()
    } finally {
      app.setLoading(false)
    }
  }

  var content = (<></>)
  if (app.cart.size === null) {
    ////  Loading Cart  ////////////////////////////////////////////////////////
    content = (<>
      <Placeholder>
        <Placeholder.Paragraph>
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
        </Placeholder.Paragraph>
      </Placeholder>
    </>)

  } else if (app.cart.items.length === 0) {
    ////  Empty Cart  //////////////////////////////////////////////////////////
    subtitle='Your cart is empty'

  } else {
    ////  Populated Cart  //////////////////////////////////////////////////////
    const items = []
    for (var i in app.cart.items) {
      let item = app.cart.items[i]
      items.push(
        <Item key={item.id}>
          <Item.Image size='small'>
            <div className='card-image cart' style={{
              backgroundImage: `url('/api/v1/content/${item.product.filename}')`
            }}></div>
          </Item.Image>
          <Item.Content>
            <Item.Header as='a' href={`/products/${item.product.id}`}>
              {item.product.name}
            </Item.Header>
            <Item.Meta>
              ${ parseFloat(item.product.price).toFixed(2) }
            </Item.Meta>
            <Item.Extra style={{ paddingTop: '1em' }}>
              <Button circular data-product-id={item.product.id} data-quantity={item.quantity} icon='minus' size='small' onClick={onSubtractQuantity} />
              <span style={{ fontSize: '1.5em', padding: '0 .75em' }}>{item.quantity}</span>
              <Button circular data-product-id={item.product.id} data-quantity={item.quantity} icon='plus' size='small' onClick={onAddQuantity} />
              <Button basic compact data-product-id={item.product.id} style={{ marginLeft: '2.25em' }} onClick={onRemoveItem} size='small'>
                Remove
              </Button>
            </Item.Extra>
          </Item.Content>
        </Item>
      )
    }
    content = (<>
      <Item.Group divided>
        {items}
      </Item.Group>
    </>)
  }

  return (<>
    <style type='text/css'>
      {`#root { padding-bottom: 8em }`}
    </style>
    <Segment style={{ margin: 0, padding: '4em 0' }} vertical>
      <SectionHeader />
      <SectionTitle title={title} subtitle={subtitle} />
      <Container>
        {content}
      </Container>
      { app.cart.subtotal &&
      <Menu borderless fixed={'bottom'} size='massive' widths={1} style={{ height: '7.5em' }} >
        <Container>
          <Menu.Item>
            <Container>
              <Header as='h3' style={{ fontSize: '1.5em' }}>
                ${parseFloat(app.cart.subtotal).toFixed(2)}
              </Header>
              <Button as='a' href='/checkout' color='blue' size='big'>
                <Button.Content visible style={{ width: '200px' }}>
                  Proceed to Checkout
                </Button.Content>
              </Button>
            </Container>
          </Menu.Item>
        </Container>
      </Menu>
      }
    </Segment>
    <SectionFooter />
  </>)
}

export default CartPage
