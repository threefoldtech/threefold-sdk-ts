const _ssh = { label: "Public SSH Key", type: "textarea" };

function capitalize(value: string): string {
  value = value.toLowerCase();
  return value[0].toUpperCase() + value.slice(1);
}

function prefixUrl(protocol: "http" | "https") {
  return (value: string) => {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return protocol + "://" + value;
  };
}

export const deploymentListEnvironments = {
  vm: { SSH_KEY: _ssh },

  algorand: {
    SSH_KEY: _ssh,
    NETWORK: { label: "Network", transform: capitalize },
    NODE_TYPE: { label: "Node Type", transform: capitalize },
    ACCOUNT_MNEMONICS: { label: "Account Mnemonics", type: "password" },
    FIRST_ROUND: "First Round",
    LAST_ROUND: "Last Round",
  },

  caprover: {
    PUBLIC_KEY: _ssh,
    SWM_NODE_MODE: "Swarm Node Mode",
    CAPROVER_ROOT_DOMAIN: false,
    CAPTAIN_IMAGE_VERSION: "Captain Image Version",
    DEFAULT_PASSWORD: { label: "Default Password", type: "password" },
    CAPTAIN_IS_DEBUG: "Debug Mode",
  },

  casperlabs: {
    SSH_KEY: _ssh,
    CASPERLABS_HOSTNAME: "Casperlabs Hostname",
  },

  jitsi: {
    SSH_KEY: _ssh,
    JITSI_HOSTNAME: "Jitsi Hostname",
  },

  discourse: {
    SSH_KEY: _ssh,
    DISCOURSE_HOSTNAME: "Discourse Hostname",
    DISCOURSE_DEVELOPER_EMAILS: "Discourse Developer Emails",
    DISCOURSE_SMTP_ADDRESS: "Discourse SMTP Address",
    DISCOURSE_SMTP_PORT: "Discourse SMTP Port",
    DISCOURSE_SMTP_ENABLE_START_TLS: "Discourse SMTP Enable Start TLS",
    DISCOURSE_SMTP_USER_NAME: "Discourse SMTP Username",
    DISCOURSE_SMTP_PASSWORD: { label: "Discourse SMTP Password", type: "password" },
    THREEBOT_PRIVATE_KEY: { label: "Threebot Private Key", type: "password" },
    FLASK_SECRET_KEY: { label: "Flask Secret Key", type: "password" },
  },

  freeflow: {
    SSH_KEY: _ssh,
  },

  funkwhale: {
    FUNKWHALE_HOSTNAME: "Funkwhale Hostname",
    DJANGO_SUPERUSER_EMAIL: "Superuser Email",
    DJANGO_SUPERUSER_USERNAME: "Superuser Username",
    DJANGO_SUPERUSER_PASSWORD: { label: "Superuser Password", type: "password" },
  },

  k8s: {
    SSH_KEY: _ssh,
    K3S_TOKEN: false,
    K3S_DATA_DIR: false,
    K3S_FLANNEL_IFACE: false,
    K3S_NODE_NAME: false,
    K3S_URL: false,
  },

  mattermost: {
    DB_PASSWORD: { label: "Database Password", type: "password" },
    SITE_URL: "Site URL",
    SMTPUsername: "SMTP Username",
    SMTPPassword: { label: "SMTP Password", type: "password" },
    SMTPServer: "SMTP Server",
    SMTPPort: "SMTP Port",
    SSH_KEY: _ssh,
    MATTERMOST_DOMAIN: false,
  },

  owncloud: {
    SSH_KEY: _ssh,
    OWNCLOUD_DOMAIN: "Owncloud Domain",
    OWNCLOUD_ADMIN_USERNAME: "Owncloud Admin Username",
    OWNCLOUD_ADMIN_PASSWORD: { label: "Owncloud Admin Password", type: "password" },
    OWNCLOUD_MAIL_SMTP_SECURE: "Owncloud Mail SMTP Secure",
    OWNCLOUD_MAIL_DOMAIN: "Owncloud Mail Domain",
    OWNCLOUD_MAIL_FROM_ADDRESS: "Owncloud Mail From Address",
    OWNCLOUD_MAIL_SMTP_HOST: "Owncloud Mail SMTP Host",
    OWNCLOUD_MAIL_SMTP_PORT: "Owncloud Mail SMTP Port",
    OWNCLOUD_MAIL_SMTP_NAME: "Owncloud Mail SMTP Name",
    OWNCLOUD_MAIL_SMTP_PASSWORD: { label: "Owncloud Mail SMTP Password", type: "password" },
  },

  nextcloud: {
    SSH_KEY: _ssh,
    NEXTCLOUD_AIO_LINK: "Nextcloud Setup",
    NEXTCLOUD_DOMAIN: "Nextcloud Domain",
  },

  peertube: {
    SSH_KEY: _ssh,
    PEERTUBE_ADMIN_EMAIL: "Peertube Admin Email",
    PT_INITIAL_ROOT_PASSWORD: { label: "Peertube Initial Root Password", type: "password" },
    PEERTUBE_WEBSERVER_HOSTNAME: "Peertube Webserver Hostname",
  },

  presearch: {
    SSH_KEY: _ssh,
    PRESEARCH_REGISTRATION_CODE: { label: "Presearch Registration Code", type: "password" },
    PRESEARCH_BACKUP_PRI_KEY: { label: "Presearch Backup Private Key", type: "textarea" },
    PRESEARCH_BACKUP_PUB_KEY: { label: "Presearch Backup Public Key", type: "textarea" },
  },

  subsquid: {
    SSH_KEY: _ssh,
    SUBSQUID_WEBSERVER_HOSTNAME: "Subsquid Webserver Hostname",
    CHAIN_ENDPOINT: "Chain Endpoint",
  },

  expose: {
    SSH_KEY: _ssh,
    EXPOSE_WEBSERVER_HOSTNAME: "Expose Webserver Hostname",
  },

  static_website: {
    SSH_KEY: _ssh,
    GITHUB_URL: "HTTPS URL for git repository",
    ROOT: "HTML Directory",
  },

  taiga: {
    SSH_KEY: _ssh,
    DOMAIN_NAME: "Domain Name",
    ADMIN_USERNAME: "Admin Username",
    ADMIN_PASSWORD: { label: "Admin Password", type: "password" },
    ADMIN_EMAIL: "Admin Email",
    DEFAULT_FROM_EMAIL: "Default Form Email",
    EMAIL_USE_TLS: "Email Use TLS",
    EMAIL_USE_SSL: "Email Use SSL",
    EMAIL_HOST: "Email Host",
    EMAIL_PORT: "Email Port",
    EMAIL_HOST_USER: "Email Host User",
    EMAIL_HOST_PASSWORD: { label: "Email Host Password", type: "password" },
  },

  umbrel: {
    SSH_KEY: _ssh,
    USERNAME: "Username",
    PASSWORD: { label: "Password", type: "password" },
    UMBREL_DISK: false,
  },

  wordpress: {
    SSH_KEY: _ssh,
    MYSQL_USER: "Superuser User",
    MYSQL_PASSWORD: { label: "Superuser Password", type: "password" },
    ADMIN_EMAIL: "Superuser Email",
    WP_URL: {
      label: "WP URL",
      transform: prefixUrl("https"),
    },
  },

  tfrobot: {
    SSH_KEY: _ssh,
  },

  jenkins: {
    SSH_KEY: _ssh,
    JENKINS_HOSTNAME: "Jenkins Hostname",
    JENKINS_ADMIN_USERNAME: "Jenkins Admin Username",
    JENKINS_ADMIN_PASSWORD: { label: "Jenkins Admin Password", type: "password" },
  },

  gitea: {
    SSH_KEY: _ssh,
    GITEA__HOSTNAME: "Gitea Hostname",
    GITEA__mailer__HOST: "Email Host",
    GITEA__mailer__PORT: "Email Port",
    GITEA__mailer__USER: "Email Host User",
    GITEA__mailer__FROM: "Send Email As",
    GITEA__mailer__ENABLED: "Email Host Enabled",
    GITEA__mailer__PASSWD: { label: "Email Host Password", type: "password" },
  },
  nostr: {
    SSH_KEY: _ssh,
    NOSTR_HOSTNAME: "Nostr Hostname",
  },

  nodepilot: {
    SSH_KEY: _ssh,
    NODE_PILOT_HOSTNAME: "Node Pilot Hostname",
  },
};
