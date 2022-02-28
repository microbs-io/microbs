// Third-party packages
import {
  Button,
  Container,
  Icon,
  Grid,
  Segment,
} from 'semantic-ui-react'

const SectionFooter = () => {
  return (
    <Segment inverted vertical style={{ padding: '5em 0em' }}>
      <Container>
        <Grid inverted stackable>
          <Grid.Row>
            <Grid.Column width={8}>
              <p>
                This store is a simulation.
              </p>
              <p>
                <Button as='a' href='https://microbs.io' compact inverted size='large'>
                  Learn more
                </Button>
                <Button as='a' href='https://github.com/microbs-io/microbs' compact inverted size='large'>
                  <Icon name='github' /> Contribute
                </Button>
              </p>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </Segment>
  )
}

export default SectionFooter
