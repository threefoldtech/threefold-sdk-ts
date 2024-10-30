enum DeployRoutes {
  BaseRoute = "/deploy/",
  PricingCalculator = "/deploy/pricing-calculator/",
  NodeFinder = "/deploy/node-finder/",
  VirtualMachines = "/deploy/virtual-machines/",
  Orchestrators = "/deploy/orchestrators/",
  Applications = "/deploy/applications/",
  Domains = "/deploy/domains/",
  YourContracts = "/deploy/your-contracts/",
  Images = "https://hub.grid.tf/",
  SSHKey = "/deploy/sshkey/",
}

enum VirtualMachinesRoutes {
  FullVirtualMachine = "/deploy/virtual-machines/full-virtual-machine/",
  MicroVirtualMachine = "/deploy/virtual-machines/micro-virtual-machine/",
}

enum OrchestratorsRoutes {
  Kubernetes = "/deploy/orchestrators/kubernetes/",
  CapRover = "/deploy/orchestrators/caprover/",
}

enum FarmRoutes {
  BaseRoute = "/farms/",
  YourFarms = "/farms/your-farms/",
  FarmFinder = "/farms/farm-finder/",
  NodeInstaller = "https://bootstrap.grid.tf/",
  Simulator = "/farms/simulator/",
}

enum TFGridRoutes {
  BaseRoute = "/tf-grid/",
  GridStatus = "https://status.grid.tf/status/threefold/",
  NodeStatistics = "/tf-grid/node-statistics/",
  NodeMonitoring = "https://metrics.grid.tf/d/rYdddlPWkfqwf/zos-host-metrics?orgId=2&refresh=30s/",
}

enum TFChainRoutes {
  BaseRoute = "/tf-chain/",
  YourProfile = "/tf-chain/your-profile/",
  TFDAO = "/tf-chain/dao/",
  TFTokenBridge = "/tf-chain/token-bridge/",
  TFTokenTransfer = "/tf-chain/token-transfer/",
  TFMintingReports = "/tf-chain/minting-reports/",
}

enum OtherRoutes {
  Manual = "https://manual.grid.tf/",
  HomePage = "/",
  Settings = "/settings",
}

enum ApplicationRoutes {
  BaseRoute = "/deploy/applications/",
  Peertube = "/deploy/applications/peertube/",
  StaticWebsite = "/deploy/applications/static_website/",
  Funkwhale = "/deploy/applications/funkwhale/",
  Mattermost = "/deploy/applications/mattermost/",
  Discourse = "/deploy/applications/discourse/",
  Taiga = "/deploy/applications/taiga/",
  Owncloud = "/deploy/applications/owncloud/",
  Nextcloud = "/deploy/applications/nextcloud/",
  Presearch = "/deploy/applications/presearch/",
  Subsquid = "/deploy/applications/subsquid/",
  Casperlabs = "/deploy/applications/casperlabs/",
  Algorand = "/deploy/applications/algorand/",
  Nodepilot = "/deploy/applications/nodepilot/",
  Wordpress = "/deploy/applications/wordpress/",
  Umbrel = "/deploy/applications/umbrel/",
  Freeflow = "/deploy/applications/freeflow/",
  TFRobot = "/deploy/applications/tfrobot/",
  Jenkins = "/deploy/applications/jenkins/",
  Gitea = "/deploy/applications/gitea/",
  Nostr = "/deploy/applications/nostr/",
  Jitsi = "/deploy/applications/jitsi/",
}

const DashboardRoutes = {
  TFGrid: { ...TFGridRoutes },
  TFChain: { ...TFChainRoutes },
  Deploy: { ...DeployRoutes },
  Applications: { ...ApplicationRoutes },
  Farms: { ...FarmRoutes },
  Other: { ...OtherRoutes },
  VirtualMachines: { ...VirtualMachinesRoutes },
  Orchestrators: { ...OrchestratorsRoutes },
};

export {
  DashboardRoutes,
  VirtualMachinesRoutes,
  TFGridRoutes,
  TFChainRoutes,
  OtherRoutes,
  OrchestratorsRoutes,
  FarmRoutes,
  DeployRoutes,
  ApplicationRoutes,
};
