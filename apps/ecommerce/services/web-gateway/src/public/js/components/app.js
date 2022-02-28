// Third party components
import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

// App components
import { Provider } from './app_context'
import CartPage from './page_cart'
import CheckoutPage from './page_checkout'
import ConfirmationPage from './page_confirmation'
import HomePage from './page_home'
import NotFoundPage from './page_not_found'
import TestPage from './page_test'

// Styles
import 'semantic-ui-css/semantic.min.css'
import '../../css/index.sass'

function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={HomePage} />
          <Route path="/cart" exact component={CartPage} />
          <Route path="/checkout" exact component={CheckoutPage} />
          <Route path="/confirmation" exact component={ConfirmationPage} />
          <Route path="/test" exact component={TestPage} />
          <Route path="*" component={NotFoundPage} />
        </Switch>
      </BrowserRouter>
    </Provider>
  )
}

export default App
