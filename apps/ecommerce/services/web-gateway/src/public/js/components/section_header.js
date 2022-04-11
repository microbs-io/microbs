// Third-party packages
import React, { useContext } from 'react'
import {
  Button,
  Container,
  Header,
  Icon,
  Item,
  Loader,
  Menu,
} from 'semantic-ui-react'

// Main packages
import { AppContext } from './app_context'

const SectionHeader = () => {

  // Global app state
  const app = useContext(AppContext)

  const css = `#root { padding-top: 4em }`
  return (<>
    <style type='text/css'>
      {css}
    </style>
    <Menu borderless fixed={'top'}>
      <Container>
        <Menu.Item as='a' href='/'>
          <Header size='medium'>
            microbs
            <Header.Subheader>
              ecommerce
            </Header.Subheader>
          </Header>
        </Menu.Item>
        <Menu.Item position='right'>
          <Button as='a' href='/cart' animated='vertical' color='blue' style={{ minWidth: '160px' }}>
            <Button.Content visible>
              <Icon name='shop' /> {app.cart.size}
            </Button.Content>
            <Button.Content hidden>
              View Cart
            </Button.Content>
            <Loader active={!app.cart.size === null} inverted />
          </Button>
        </Menu.Item>
      </Container>
    </Menu>
  </>)
}

export default SectionHeader
