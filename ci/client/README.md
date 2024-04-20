# starshipjs

<p align="center">
  <img src="https://user-images.githubusercontent.com/10805402/242348990-c141d6cd-e1c9-413f-af68-283de029c3a4.png" width="80"><br />
    Starship TypeScript Utilties
</p>

<p align="center" width="100%">
  <a href="https://github.com/cosmology-tech/starshipjs/actions/workflows/run-tests.yml">
    <img height="20" src="https://github.com/cosmology-tech/starshipjs/actions/workflows/run-tests.yml/badge.svg" />
  </a>
   <a href="https://github.com/cosmology-tech/starshipjs/blob/main/LICENSE"><img height="20" src="https://img.shields.io/badge/license-BSD%203--Clause%20Clear-blue.svg"></a>
</p>

**StarshipJS** is the JS companion to deploy and manage [Starship](https://github.com/cosmology-tech/starship), tailored specifically for Node.js and TypeScript developers. This toolkit provides a seamless, easy-to-use interface that dramatically simplifies the development, testing, and deployment of interchain applications, whether on your local machine or CI/CD environments.

Designed with simplicity and speed in mind, **StarshipJS** enables developers to quickly integrate Starship into their blockchain projects without complex orchestration.

## Features

👨🏻‍💻 **Node.js and TypeScript Focused**: Tailored specifically for JavaScript ecosystems, **StarshipJS** brings simplicity to multi-chain development for Node.js and TypeScript environments, streamlining the setup and coding processes.

🚀 **Simplified Interchain Development**: Enables the straightforward creation of applications that span multiple blockchain networks. This simplifies complex blockchain interactions, enhancing interoperability and making it easier to build sophisticated interchain solutions.

🔒 **Security-First Approach**: **StarshipJS** incorporates security best practices from the ground up. Facilitates secure coding practices and configurations, helping developers build secure blockchain applications by default, reducing the risk of vulnerabilities.

## install

Install the test utilities `starshipjs` and the CI client `@starship-ci/client`:

```sh
npm install starshipjs @starship-ci/client

```
## Table of contents

- [starshipjs](#starshipjs)
  - [Install](#install)
  - [Table of contents](#table-of-contents)
- [Usage](#usage)
  - [Configuration](#configuration)
  - [Using the StarshipClient](#using-the-starshipclient)
  - [Initializing the Client](#initializing-the-client)
  - [Starting Port Forwarding](#setting-up-and-installing-the-chart)
  - [Stopping And Cleaning up](#stopping-and-cleaning-up)
- [Developing](#developing)
- [Credits](#credits)

## Usage 

### Using the StarshipClient

The `StarshipClient` simplifies managing Kubernetes resources, specifically tailored for developers working in interchain environments. Below is an example showing how to instantiate the client and use it to manage a Helm deployment:

### Initializing the Client

First, you need to import and initialize the `StarshipClient` with your Helm configuration:

```js
import { StarshipClient } from '@starship-ci/client';

const client = new StarshipClient({
  helmName: 'osmojs',
  helmFile: 'path/to/config.yaml',
  helmRepo: 'starship',
  helmRepoUrl: 'https://cosmology-tech.github.io/starship/',
  helmChart: 'devnet',
  helmVersion: 'v0.1.38'
});
```

### Configuration

After initializing, you can load in your config. Assuming you have a `yaml` file:

```js
client.loadConfig();
```

If you don't have one, you can set and save a configuration directly from the client:

```js
client.setConfig(config);
client.saveConfig(config);
```

### Setting Up and Installing the Chart

After initializing, set up the environment and install the starship helm chart:

```js
// adds helm chart to registry
client.setup();
// installs helm chart
client.deploy();
```

### Starting Port Forwarding

For local development, you might need to forward ports from your Kubernetes pods:

```js
client.startPortForward();
```

### Stopping and Cleaning Up

Once done with development or testing, you can stop the port forwarding and remove the Helm chart:

```js
// stop port forwarding AND
// remove the deployed release from your Kubernetes cluster
client.undeploy();

// remove the helm chart
client.teardown();
```

## Developing


When first cloning the repo:
```
yarn
yarn build
```

## Related

Checkout these related projects:

* [@cosmology/telescope](https://github.com/cosmology-tech/telescope) Your Frontend Companion for Building with TypeScript with Cosmos SDK Modules.
* [@cosmwasm/ts-codegen](https://github.com/CosmWasm/ts-codegen) Convert your CosmWasm smart contracts into dev-friendly TypeScript classes.
* [chain-registry](https://github.com/cosmology-tech/chain-registry) Everything from token symbols, logos, and IBC denominations for all assets you want to support in your application.
* [cosmos-kit](https://github.com/cosmology-tech/cosmos-kit) Experience the convenience of connecting with a variety of web3 wallets through a single, streamlined interface.
* [create-cosmos-app](https://github.com/cosmology-tech/create-cosmos-app) Set up a modern Cosmos app by running one command.
* [interchain-ui](https://github.com/cosmology-tech/interchain-ui) The Interchain Design System, empowering developers with a flexible, easy-to-use UI kit.
* [starship](https://github.com/cosmology-tech/starship) Unified Testing and Development for the Interchain.

## Credits

🛠 Built by Cosmology — if you like our tools, please consider delegating to [our validator ⚛️](https://cosmology.zone/validator)


## Disclaimer

AS DESCRIBED IN THE LICENSES, THE SOFTWARE IS PROVIDED “AS IS”, AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND.

No developer or entity involved in creating this software will be liable for any claims or damages whatsoever associated with your use, inability to use, or your interaction with other users of the code, including any direct, indirect, incidental, special, exemplary, punitive or consequential damages, or loss of profits, cryptocurrencies, tokens, or anything else of value.