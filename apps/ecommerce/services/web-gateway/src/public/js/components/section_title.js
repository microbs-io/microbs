// Third-party packages
import {
  Container,
  Header,
} from 'semantic-ui-react'

const SectionTitle = (props) => {
  return (
    <Container style={{ marginBottom: '3em' }}>
      <Header as='h1' content={props.title} style={{ fontSize: '3em' }} textAlign='center' />
      {props.subtitle &&
        <Header as='h2' content={props.subtitle} textAlign='center'/>
      }
    </Container>
  )
}

export default SectionTitle
