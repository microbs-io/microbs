// Third-party packages
import React, { useContext } from 'react'
import {
  Button,
  Container,
  Grid,
  Icon,
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
    <Menu fixed={'top'} widths={1}>
      <Menu.Item>
        <Grid container columns={3} stretched>
          <Grid.Column width={3}>
            <Button as='a' href='/' style={{ background: 'none' }}>
              <Button.Content>
                microbs
              </Button.Content>
              <Loader active={!app.cart.size === null} inverted />
            </Button>
          </Grid.Column>
          <Grid.Column width={10}>

          </Grid.Column>
          <Grid.Column width={3}>
            <Button as='a' href='/cart' animated='vertical' color='blue'>
              <Button.Content visible>
                <Icon name='shop' /> {app.cart.size}
              </Button.Content>
              <Button.Content hidden>
                View Cart
              </Button.Content>
              <Loader active={!app.cart.size === null} inverted />
            </Button>
          </Grid.Column>
        </Grid>
      </Menu.Item>
    </Menu>
  </>)
}

export default SectionHeader
