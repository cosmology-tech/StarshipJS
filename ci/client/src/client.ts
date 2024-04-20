import chalk from 'chalk';
import deepmerge from 'deepmerge';
import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as os from 'os';
import * as shell from 'shelljs';

import { Chain, StarshipConfig } from './config';
import { Ports } from './config';
import { dependencies as defaultDependencies, Dependency } from "./deps";
import { readAndParsePackageJson } from './package';
import { mkdirp } from 'mkdirp';
import { dirname } from 'path';

export interface StarshipContext {
  helmName: string;
  helmFile: string;
  helmRepo: string;
  helmRepoUrl: string;
  helmChart: string;
  helmVersion: string;
  kindCluster?: string;
  verbose?: boolean;
  curdir?: string;
};

export interface PodPorts {
  registry?: Ports,
  explorer?: Ports,
  chains?: {
    defaultPorts?: Ports,
    [chainName: string]: Ports
  }
}

// TODO talk to Anmol about moving these into yaml, if not already possible?
const defaultPorts: PodPorts = {
  explorer: {
    rest: 8080
  },
  registry: {
    grpc: 9090,
    rest: 8080
  },
  chains: {
    defaultPorts: {
      rpc: 26657,
      rest: 1317,
      exposer: 8081,
      faucet: 8000
    }
  }
};
export interface StarshipClientI {
  ctx: StarshipContext;
  version: string;
  dependencies: Dependency[];
  depsChecked: boolean;
  config: StarshipConfig;
  podPorts: PodPorts
};

export class StarshipClient implements StarshipClientI{
  ctx: StarshipContext;
  version: string;
  dependencies: Dependency[] = defaultDependencies;
  depsChecked: boolean = false;
  config: StarshipConfig;
  podPorts: PodPorts = defaultPorts;

  constructor(ctx: StarshipContext) {
    this.ctx = ctx;
    // TODO add semver check against net
    this.version = readAndParsePackageJson().version;
  }

  private exec(cmd: string[]): shell.ShellString {
    this.checkDependencies();
    const str = cmd.join(' ');
    this.log(str);
    return shell.exec(str);
  }

  private log(str: string): void {
    // add log level
    this.log(str);
  }

  private exit(code: number): void {
    shell.exit(code);
  }

  private checkDependencies(): void {
    if (this.depsChecked) return;

    const platform = os.platform();
    const messages: string[] = [];
    const depMessages: string[] = [];
    const missingDependencies = this.dependencies.filter(dep => !dep.installed);

    if (!missingDependencies.length) {
      this.depsChecked = true;
      return;
    }

    this.dependencies.forEach(dep => {
      if (missingDependencies.find(d => d.name === dep.name)) {
        depMessages.push(`${chalk.red('x')}${dep.name}`);
      } else {
        depMessages.push(`${chalk.green('✓')}${dep.name}`);
      }
    });

    messages.push('\n'); // Adding a newline for better readability

    missingDependencies.forEach(dep => {
      messages.push(chalk.bold.white(dep.name + ': ') + chalk.cyan(dep.url));

      if (dep.name === 'helm' && platform === 'darwin') {
        messages.push(chalk.gray("Alternatively, you can install using brew: ") + chalk.white.bold("`brew install helm`"));
      }

      if (dep.name === 'kubectl' && platform === 'darwin') {
        messages.push(chalk.gray("Alternatively, you can install Docker for Mac which includes Kubernetes: ") + chalk.white.bold(dep.macUrl));
      }

      if (dep.name === 'docker' && platform === 'darwin') {
        messages.push(chalk.gray("For macOS, you may also consider Docker for Mac: ") + chalk.white.bold(dep.macUrl));
      } else if (dep.name === 'docker') {
        messages.push(chalk.gray("For advanced Docker usage and installation on other platforms, see: ") + chalk.white.bold(dep.url));
      }

      messages.push('\n'); // Adding a newline for separation between dependencies
    });

    this.log(depMessages.join('\n'));
    this.log('\nPlease install the missing dependencies:');
    this.log(messages.join('\n'));
    this.exit(1);
  }

  public setup(): void {
    this.setupHelm();
  }

  public teardown(): void {
    this.removeHelm();
  }

  private loadYaml(filename: string): any {
    const fileContents = readFileSync(filename, 'utf8');
    return yaml.load(fileContents);
  }

  private saveYaml(filename: string, obj: any): any {
    const yamlContent = yaml.dump(obj);
    mkdirp.sync(dirname(filename));
    writeFileSync(filename, yamlContent, 'utf8');
  }

  public loadConfig(): void {
    this.config = this.loadYaml(this.ctx.helmFile) as StarshipConfig;
  }

  public saveConfig(): void {
    this.saveYaml(this.ctx.helmFile, this.config);
  }

  public savePodPorts(filename: string): void {
    this.saveYaml(filename, this.podPorts);
  }

  public loadPodPorts(filename: string): void {
    this.podPorts = this.loadYaml(filename) as PodPorts;
  }

  public setConfig(config: StarshipConfig): void {
    this.config = config;
  }

  public setPodPorts(ports: PodPorts): void {
    this.podPorts = deepmerge(defaultPorts, ports);
  }

  // TODO do we need this here?
  public test(): void {
    this.exec([
      'yarn',
      'run',
      'jest',
      `--testPathPattern=../${this.ctx.helmRepo}`,
      '--verbose',
      '--bail'
    ]);
  }

  public undeploy(): void {
    this.stopPortForward();
    this.deleteHelm();
  }

  public clean(): void {
    this.undeploy();
    this.cleanKind();
  }

  private setupHelm(): void {
    this.exec([
      'helm',
      'repo',
      'add',
      this.ctx.helmRepo,
      this.ctx.helmRepoUrl
    ]);
    this.exec(['helm', 'repo', 'update']);
    this.exec([
      'helm',
      'search',
      'repo',
      `${this.ctx.helmRepo}/${this.ctx.helmChart}`,
      '--version',
      this.ctx.helmVersion
    ]);
  }

  private removeHelm(): void {
    this.exec([
      'helm',
      'repo',
      'remove',
      this.ctx.helmRepo
    ]);
  }

  public deploy(): void {
    this.log("Installing the helm chart. This is going to take a while.....");
    this.exec([
      'helm',
      'install',
      '-f',
      this.ctx.helmFile,
      this.ctx.helmName,
      `${this.ctx.helmRepo}/${this.ctx.helmChart}`,
      '--version',
      this.ctx.helmVersion
    ]);
    this.log("Run \"kubectl get pods\" to check the status of the cluster");
  }

  public upgrade(): void {
    this.exec([
      'helm',
      'upgrade',
      '--debug',
      '-f',
      this.ctx.helmFile,
      this.ctx.helmName,
      `${this.ctx.helmRepo}/${this.ctx.helmChart}`,
      '--version',
      this.ctx.helmVersion
    ]);
  }

  public debug(): void {
    this.exec([
      'helm',
      'install',
      '--dry-run',
      '--debug',
      '-f',
      this.ctx.helmFile,
      this.ctx.helmName,
      `${this.ctx.helmRepo}/${this.ctx.helmChart}`
    ]);
  }

  private deleteHelm(): void {
    this.exec(['helm', 'delete', this.ctx.helmName]);
  }


  private forwardPort(chain: Chain, localPort: number, externalPort: number): void {
    if (localPort !== undefined && externalPort !== undefined) {
      this.exec([
        "kubectl", "port-forward",
        `pods/${chain.name}-genesis-0`,
        `${localPort}:${externalPort}`,
        ">", "/dev/null",
        "2>&1", "&"
      ]);
      this.log(chalk.yellow(`Forwarded ${chain.name}: local ${localPort} -> target (host) ${externalPort}`));
    }
  }
  
  private forwardPortService(serviceName: string, localPort: number, externalPort: number): void {
    if (localPort !== undefined && externalPort !== undefined) {
      this.exec([
        "kubectl", "port-forward",
        `service/${serviceName}`,
        `${localPort}:${externalPort}`,
        ">", "/dev/null",
        "2>&1", "&"
      ]);
      this.log(`Forwarded ${serviceName} on port ${localPort} to target port ${externalPort}`);
    }
  }

  public startPortForward(): void {
    if (!this.config) {
      throw new Error('no config!');
    }
    this.log("Attempting to stop any existing port-forwards...");
    this.stopPortForward();
    this.log("Starting new port forwarding...");
  
    this.config.chains.forEach(chain => {
      // TODO Talk to Anmol about chain.name and chain.type, seems to be opposite of intuition using chainReg as concept
      const chainPodPorts = this.podPorts.chains[chain.type] || this.podPorts.chains.defaultPorts;

      if (chain.ports.rpc) this.forwardPort(chain, chain.ports.rpc,  chainPodPorts.rpc);
      if (chain.ports.rest) this.forwardPort(chain, chain.ports.rest, chainPodPorts.rest);
      if (chain.ports.exposer) this.forwardPort(chain, chain.ports.exposer, chainPodPorts.exposer);
      if (chain.ports.faucet) this.forwardPort(chain, chain.ports.faucet, chainPodPorts.faucet);
    });
  
    if (this.config.registry?.enabled) {
      this.forwardPortService("registry", this.config.registry.ports.rest, this.podPorts.registry.rest);
      this.forwardPortService("registry", this.config.registry.ports.grpc, this.podPorts.registry.grpc);
    }
  
    if (this.config.explorer?.enabled) {
      this.forwardPortService("explorer", this.config.explorer.ports.rest, this.podPorts.explorer.rest);
    }
  }
  
  // TODO review with Anmol, which stopForward is better...
  // public stopForward(): void {
  //   this.exec(['pkill', '-f', 'port-forward']);
  // }

  public stopPortForward(): void {
    this.log(chalk.green("Trying to stop all port-forward, if any...."));
    const result = this.exec([
      "ps", "-ef",
      "|", "grep", "-i", "'kubectl port-forward'",
      "|", "grep", "-v", "'grep'",
      "|", "awk", "'{print $2}'"
    ]);
    const pids = (result || '').split('\n');
    pids.forEach(pid => {
      if (pid.trim()) {
        this.exec([
          "kill", "-15", pid
        ]);
      }
    });
    this.exec(['sleep', '2']);
  }

  private setupKind(): void {
    if (this.ctx.kindCluster) {
      this.exec(['kind', 'create', 'cluster', '--name', this.ctx.kindCluster]);
    }
  }

  private cleanKind(): void {
    if (this.ctx.kindCluster) {
      this.exec(['kind', 'delete', 'cluster', '--name', this.ctx.kindCluster]);
    }
  }
}