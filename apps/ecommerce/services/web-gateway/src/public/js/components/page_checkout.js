// Third-party packages
import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Button,
  Container,
  Form,
  Header,
  Icon,
  Input,
  Grid,
  Menu,
  Message,
  Placeholder,
  Segment,
} from 'semantic-ui-react'
import dateFormat from 'dateformat'
import faker from '@faker-js/faker/dist/faker.js'
import { GenCC } from 'creditcard-generator'

// Main packages
import * as api from '../api'
import { AppContext } from './app_context'
import SectionFooter from './section_footer'
import SectionHeader from './section_header'
import SectionTitle from './section_title'

const CheckoutPage = () => {

  // Global app state
  const app = useContext(AppContext)
  const history = useHistory()

  const [shippingAddressStreet1, setShippingAddressStreet1] = useState('')
  const [shippingAddressStreet2, setShippingAddressStreet2] = useState('')
  const [shippingAddressCity, setShippingAddressCity] = useState('')
  const [shippingAddressState, setShippingAddressState] = useState('')
  const [shippingAddressPostalCode, setShippingAddressPostalCode] = useState('')
  const [shippingAddressCountry, setShippingAddressCountry] = useState('')
  const [billingAddressStreet1, setBillingAddressStreet1] = useState('')
  const [billingAddressStreet2, setBillingAddressStreet2] = useState('')
  const [billingAddressCity, setBillingAddressCity] = useState('')
  const [billingAddressState, setBillingAddressState] = useState('')
  const [billingAddressPostalCode, setBillingAddressPostalCode] = useState('')
  const [billingAddressCountry, setBillingAddressCountry] = useState('')
  const [billingCardName, setBillingCardName] = useState('')
  const [billingCardNumber, setBillingCardNumber] = useState('')
  const [billingCardExpiration, setBillingCardExpiration] = useState('')
  const [billingCardSecurityCode, setBillingCardSecurityCode] = useState('')
  const [billingCardPostalCode, setBillingCardPostalCode] = useState('')
  
  const randomUser = () => {
    faker.setLocale('en_US')
    const postalCode = faker.address.zipCode().split('-')[0]
    const user = {
      address: {
        street_1: faker.address.streetAddress(),
        street_2: Math.random() > 0.8 ? faker.address.secondaryAddress() : '',
        city: faker.address.cityName(),
        state: faker.address.stateAbbr(),
        postal_code: postalCode,
        country: 'US'
      },
      card: {
        name: `${faker.name.firstName()} ${faker.name.lastName()}`,
        number: GenCC('VISA')[0],
        expiration: dateFormat(faker.date.future(), 'mm/yy'),
        security_code: faker.finance.creditCardCVV(),
        postal_code: postalCode
      }
    }
    return user
  }
  const randomizeCheckoutForm = () => {
    const user = randomUser()
    setShippingAddressStreet1(user.address.street_1)
    setShippingAddressStreet2(user.address.street_2)
    setShippingAddressCity(user.address.city)
    setShippingAddressState(user.address.state)
    setShippingAddressPostalCode(user.address.postal_code)
    setShippingAddressCountry(user.address.country)
    setBillingAddressStreet1(user.address.street_1)
    setBillingAddressStreet2(user.address.street_2)
    setBillingAddressCity(user.address.city)
    setBillingAddressState(user.address.state)
    setBillingAddressPostalCode(user.address.postal_code)
    setBillingAddressCountry(user.address.country)
    setBillingCardName(user.card.name)
    setBillingCardNumber(user.card.number)
    setBillingCardExpiration(user.card.expiration)
    setBillingCardSecurityCode(user.card.security_code)
    setBillingCardPostalCode(user.card.postal_code)
  }
  
  useEffect(() => {
    randomizeCheckoutForm()
  }, [])

  var title = 'Checkout'
  var subtitle = ''

  const onSubmit = async (e) => {
    e.preventDefault()
    const data = {
      amount: app.cart.subtotal,
      shipping: {
        address: {
          street_1: shippingAddressStreet1,
          street_2: shippingAddressStreet2,
          city: shippingAddressCity,
          state: shippingAddressState,
          postal_code: shippingAddressPostalCode,
          country: shippingAddressCountry,
        }
      },
      billing: {
        address: {
          street_1: billingAddressStreet1 || shippingAddressStreet1,
          street_2: billingAddressStreet2 || shippingAddressStreet2,
          city: billingAddressCity || shippingAddressCity,
          state: billingAddressState || shippingAddressState,
          postal_code: billingAddressPostalCode || shippingAddressPostalCode,
          country: billingAddressCountry || shippingAddressCountry,
        },
        card: {
          name: billingCardName,
          number: billingCardNumber,
          expiration: billingCardExpiration,
          security_code: billingCardSecurityCode,
          postal_code: billingCardPostalCode,
        }
      }
    }
    app.setLoading(true)
    try {
      const response = await api.checkout(data)
      await app.refreshCart()
      if (response.status == 200)
        history.push('/confirmation')
    } finally {
      app.setLoading(false)
    }
  }

  var content = (<></>)
  if (app.cart.size === null) {
    ////  Loading Cart  ////////////////////////////////////////////////////////
    content = (
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
    )

  } else if (app.cart.items.length === 0) {
    ////  Empty Cart  //////////////////////////////////////////////////////////
    subtitle = 'Your cart is empty'

  } else {
    ////  Checkout Form  ///////////////////////////////////////////////////////
    content = (
      <Segment.Group>
        <Segment color='teal' style={{ background: '#fcfcfc' }}>
          <Message icon color='yellow' style={{ marginBottom: '2em' }}>
            <Icon name='warning sign' />
            This store is only a simulation. Don't submit any real personal information.
          </Message>
          <Header as='h4' content='Shipping Address' style={{ fontSize: '1.5em', margin: '.75em auto', textAlign: 'center' }} />
          <Form.Field
            control={Input}
            onChange={(e) => setShippingAddressStreet1(e.target.value)}
            placeholder='Street'
            value={shippingAddressStreet1}
          />
          <Form.Field
            control={Input}
            onChange={(e) => setShippingAddressStreet2(e.target.value)}
            placeholder='Street (2)'
            value={shippingAddressStreet2}
          />
          <Form.Group widths='equal'>
            <Form.Field
              control={Input}
              onChange={(e) => setShippingAddressCity(e.target.value)}
              placeholder='City'
              value={shippingAddressCity}
            />
            <Form.Field
              control={Input}
              onChange={(e) => setShippingAddressState(e.target.value)}
              placeholder='State'
              value={shippingAddressState}
            />
            <Form.Field
              control={Input}
              onChange={(e) => setShippingAddressPostalCode(e.target.value)}
              placeholder='Postal Code'
              value={shippingAddressPostalCode}
            />
            <Form.Field
              control={Input}
              onChange={(e) => setShippingAddressCountry(e.target.value)}
              placeholder='Country'
              value={shippingAddressCountry}
            />
          </Form.Group>
        </Segment>
        <Segment style={{ background: '#fcfcfc' }}>
          <Header as='h4' content='Payment Method' style={{ fontSize: '1.5em', margin: '.75em auto', textAlign: 'center' }} />
          <Form.Field
            control={Input}
            onChange={(e) => setBillingCardName(e.target.value)}
            placeholder='Name on Card'
            value={billingCardName}
          />
          <Form.Field
            control={Input}
            onChange={(e) => setBillingCardNumber(e.target.value)}
            placeholder='Card Number'
            value={billingCardNumber}
          />
          <Form.Group widths='equal'>
            <Form.Field
              control={Input}
              onChange={(e) => setBillingCardExpiration(e.target.value)}
              placeholder='Card Expiration'
              value={billingCardExpiration}
            />
            <Form.Field
              control={Input}
              onChange={(e) => setBillingCardSecurityCode(e.target.value)}
              placeholder='Card Security Code'
              value={billingCardSecurityCode}
            />
            <Form.Field
              control={Input}
              onChange={(e) => setBillingCardPostalCode(e.target.value)}
              placeholder='Card Postal Code'
              value={billingCardPostalCode}
            />
          </Form.Group>
        </Segment>
      </Segment.Group>
    )
  }

  return (<>
    <style type='text/css'>
      {`#root { padding-bottom: 8em }`}
    </style>
    <Form onSubmit={onSubmit}>
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
                <Button as='button' button={{ type: 'submit' }} color='teal' loading={app.loading} size='big'>
                  <Button.Content visible style={{ width: '200px' }}>
                    Submit Payment
                  </Button.Content>
                </Button>
              </Container>
            </Menu.Item>
          </Container>
        </Menu>
        }
      </Segment>
    </Form>
    <SectionFooter />
  </>)
}

export default CheckoutPage
