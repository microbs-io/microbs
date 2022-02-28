// Third-party packages
import React, { useContext, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Container,
  Header,
  Icon,
  Grid,
  Placeholder,
  Segment,
} from 'semantic-ui-react'

// Main packages
import * as api from '../api'
import { AppContext } from './app_context'
import SectionFooter from './section_footer'
import SectionHeader from './section_header'
import SectionTitle from './section_title'

const HomePage = () => {

  // Global app state
  const app = useContext(AppContext)

  var title = 'Special Offers'
  var subtitle = ''

  const [pending, setPending] = useState({})
  const [products, setProducts] = useState([])
  useEffect(() => {
    const getProducts = async () => {
      const res = await api.productSearch({
        query: '',
        page: {
          size: 6
        }
      })
      setProducts(res.data.results || [])
    }
    getProducts()
  }, [])

  const onCartItemAdd = async (e) => {
    e.stopPropagation()
    const productId = e.currentTarget.getAttribute('data-product-id')
    setPending(pending => ({
      ...pending,
      [productId]: true
    }))
    try {
      const response = await api.cartItemAdd(productId, 1)
      console.log(response)
      await app.refreshCart()
    } finally {
      delete pending[productId]
      setPending(pending => ({
        ...pending,
        [productId]: undefined
      }))
    }
  }

  const onCartItemRemove = async (e) => {
    e.stopPropagation()
    const productId = e.currentTarget.getAttribute('data-product-id')
    setPending(pending => ({
      ...pending,
      [productId]: true
    }))
    try {
      const response = await api.cartItemRemove(productId, 1)
      console.log(response)
      await app.refreshCart()
    } finally {
      delete pending[productId]
      setPending(pending => ({
        ...pending,
        [productId]: undefined
      }))
    }
  }

  const productCards = []
  if (!products.length) {
    for (var i = 0; i < 3; i++) {
      productCards.push(
        <Grid.Column key={i}>
          <Card fluid>
            <Placeholder>
              <Placeholder.Image className='card-image' rectangular />
            </Placeholder>
            <Card.Content>
              <Card.Header>
                <Placeholder>
                  <Placeholder.Header>
                    <Placeholder.Line />
                  </Placeholder.Header>
                </Placeholder>
              </Card.Header>
              <Card.Description>
              <Placeholder>
                <Placeholder.Paragraph>
                  <Placeholder.Line />
                  <Placeholder.Line />
                </Placeholder.Paragraph>
              </Placeholder>
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <Grid container verticalAlign='middle'>
                <Grid.Column style={{ paddingLeft: 0, paddingRight: 0 }} width={9}>
                  <Placeholder>
                    <Placeholder.Header>
                      <Placeholder.Line />
                    </Placeholder.Header>
                  </Placeholder>
                </Grid.Column>
                <Grid.Column textAlign='right' width={7}>
                  <Placeholder>
                    <Placeholder.Header>
                      <Placeholder.Line />
                    </Placeholder.Header>
                  </Placeholder>
                </Grid.Column>
              </Grid>
            </Card.Content>
          </Card>
        </Grid.Column>
      )
    }
  } else {
    for (var i in products) {
      let product = products[i]
      productCards.push(
        <Grid.Column key={product.id}>
          <Card fluid>
            <div className='card-image' style={{
              backgroundImage: `url('/api/v1/content/${product.filename}')`
            }}></div>
            <Card.Content>
              <Card.Header>{product.name}</Card.Header>
              <Card.Description>
                {product.description}
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <Grid container verticalAlign='middle'>
                <Grid.Column style={{ paddingLeft: 0, paddingRight: 0 }} width={9}>
                  { app.cartHas(product.id) ?
                    <Button animated='vertical' color='standard' compact data-product-id={product.id} disabled={pending[product.id]} fluid onClick={onCartItemRemove} size='large'>
                      <Button.Content visible>
                        <Icon name='check' /> Added
                      </Button.Content>
                      <Button.Content hidden>
                        <Icon name='x' /> Remove
                      </Button.Content>
                    </Button>
                    :
                    <Button color='teal' compact data-product-id={product.id} disabled={pending[product.id]} fluid onClick={onCartItemAdd} size='large'>
                      <Icon name='cart plus' /> Add to cart
                    </Button>
                  }
                </Grid.Column>
                <Grid.Column textAlign='right' width={7}>
                  <Header as='h3'>${product.price}</Header>
                </Grid.Column>
              </Grid>
            </Card.Content>
          </Card>
        </Grid.Column>
      )
    }
  }

  return (
    <div>
      <Segment textAlign='center' style={{ margin: 0, padding: '4em 0' }} vertical>
        <SectionHeader />
        <SectionTitle title={title} subtitle={subtitle} />
        <Grid container columns={3} doubling stackable stretched>
          {productCards}
        </Grid>
      </Segment>
      <SectionFooter/>
    </div>
  )
}

export default HomePage
