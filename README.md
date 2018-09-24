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

### PCF Dev on a Mac

 - Install VirtualBox or another supported hypervisor for your operating system
 - [Install the CF command line client](https://pivotal.io/platform/pcf-tutorials/getting-started-with-pivotal-cloud-foundry-dev/install-the-cf-cli)
 - Install the [PCF Dev](https://pivotal.io/platform/pcf-tutorials/getting-started-with-pivotal-cloud-foundry-dev/install-pcf-dev)

Once the installation is complete, start PCF Dev (you can set the memory limits):
```
$ cf dev start -m 8192
```

After a couple of minutes you should have system running. 

Open your browser and point to `https://apps.local.pcfdev.io`

Create `cf-staging-space` and `f-production-space` spaces within the `pcfdev-org` organization:

```
$ cf login -a https://api.local.pcfdev.io --skip-ssl-validation -u admin -p admin -o pcfdev-org
$ cf create-space cf-staging-space  -o pcfdev-org
$ cf create-space cf-production-space  -o pcfdev-org
```

### Install the Atomist command-line utility

```
$ npm install -g @atomist/cli
```

### Configuration
The following configuration should be in your `~/.atomist/client.config.json` in order to successfully connect your SDM to PCF Dev:
```
  "sdm": {
    "cloudfoundry": {
      "api": "https://api.local.pcfdev.io",
      "user": "admin",
      "password": "admin",
      "org": "pcfdev-org",
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