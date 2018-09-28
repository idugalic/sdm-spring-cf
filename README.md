# Software Delivery Machine (Cloudfoundry PCF) - by Atomist

The SDM framework enables you to control your delivery process in
code.  Think of it as an API for your software delivery.  See this
[introduction][atomist-doc] for more information on the concept of a
Software Delivery Machine and how to create and develop on an SDM.

[atomist-doc]: https://docs.atomist.com/ (Atomist Documentation)

## Getting Started

### Clone this repo to:

```
~/atomist/<owner>/sdm-spring-cf
```
Note: `<owner>` is your Github owner, e.g: idugalic

### PCF Dev

 - [Download and install the CF command line client and PCF Dev (PAS 2.0.20.0)](https://docs.pivotal.io/pcf-dev/install-osx.html)

Once the installation is complete, start PCF Dev:
```
$ cf dev start -f .ISO-FILE
```

After a couple of minutes you should have system running. 

Login and create two spaces `cf-staging-space` , `cf-production-space` within `cfdev-org` organization:

```
$ cf login -a https://api.dev.cfdev.sh -o cfdev-org --skip-ssl-validation
$ cf create-space cf-staging-space
$ cf create-space cf-production-space
```

You can use the application manager by navigating to https://apps.dev.cfdev.sh/

### Install the Atomist command-line utility

```
$ npm install -g @atomist/cli
```

### Configuration
The following configuration should be in your `~/.atomist/client.config.json` in order to successfully connect your SDM to PCF Dev:
```
   "sdm": {
    "cloudfoundry": {
      "api": "https://api.dev.cfdev.sh",
      "user": "admin",
      "password": "admin",
      "org": "cfdev-org",
      "spaces": {
        "staging": "cf-staging-space",
        "production": "cf-production-space"
      }
    }
  }

```

### Start your local SDM

Install the project dependencies using NPM, compile the TypeScript, and start your SDM in local mode:
```
$ cd ~/atomist/<owner>/sdm-spring-cf
$ atomist start --local
```

### See messages from SDM events

In order to see messages from events (not interspersed with logs), activate a message listener in another terminal:
```
atomist feed
```

### Adding Projects

Further projects can be added under the expanded directory tree in two ways:

#### Configure Existing Projects
If you already have repositories cloned/copied under your `~/atomist/<owner>/`, configure them to activate the local SDM on commit.

Add the Atomist git hook to the existing git projects within this directory structure by running the following command/s:
```
$ cd ~/atomist/<owner>/<repo>
$ atomist add git hooks
```
#### 'atomist clone' Command
The easiest way to add an existing project to your SDM projects is: run the atomist clone command to clone a GitHub.com repository in the right place in the expanded tree and automatically install the git hooks:

`atomist clone https://github.com/<owner>/<repo>`