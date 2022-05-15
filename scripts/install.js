/*
 * install.js
 * 
 * Installs the microbs command-line interface, plugins, and apps.
 */
const { execSync } = require('child_process')
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

// Install @microbs.io/cli as a global package
run('echo ""')
run('echo "Installing @microbs.io/cli as a global package "')
run('echo ""')
run('npm install -g @microbs.io/cli')

// Create $HOME/.microbs and $HOME/.microbs/config.yaml if they do not exist
run('echo ""')
run('echo "Creating $HOME/.microbs and $HOME/.microbs/config.yaml if they do not exist..."')
run('microbs init')

// Install all official microbs plugins
run('echo "Installing all official microbs plugins..."')
run('microbs plugins install --all')

// Install all official microbs apps
run('echo "Installing all official microbs apps..."')
run('microbs apps install --all')

// Done
run('echo "Done: Installed microbs $(microbs version)"')
run('echo ""')
run('echo "You can now run the microbs command."')
run('echo ""')
