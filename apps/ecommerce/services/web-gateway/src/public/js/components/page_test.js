// Third-party packages
import React, { useEffect, useState } from 'react'
import {
  Container,
  Segment,
} from 'semantic-ui-react'

// Main packages
import * as api from '../api'
import SectionFooter from './section_footer'
import SectionHeader from './section_header'
import SectionTitle from './section_title'

const TestPage = () => {

  const [message, setMessage] = useState('')
  useEffect(() => {
    const getMessage = async () => {
      const res = await api.healthz()
      setMessage(JSON.stringify(res.data, null, 2))
    }
    getMessage()
  }, [])

  return (<>
    <Segment style={{ margin: 0, padding: '4em 0' }}>
      <SectionHeader />
      <SectionTitle title='Test' />
      <Container>
        <pre>
          {message}
        </pre>
      </Container>
    </Segment>
    <SectionFooter />
  </>)
}

export default TestPage
