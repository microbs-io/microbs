// Third-party packages
import React, { useEffect, useState } from 'react'
import {
  Segment,
} from 'semantic-ui-react'

// Main packages
import SectionFooter from './section_footer'
import SectionHeader from './section_header'
import SectionTitle from './section_title'

const ConfirmationPage = () => {
  return (<>
    <Segment style={{ margin: 0, padding: '4em 0' }}>
      <SectionHeader />
      <SectionTitle title='Hooray!' subtitle={'Your order has been placed.'} />
      <div style={{ fontSize: '4em', padding: '.5em 0 2em 0', textAlign: 'center' }}>
        🙌
      </div>
    </Segment>
    <SectionFooter />
  </>)
}

export default ConfirmationPage
