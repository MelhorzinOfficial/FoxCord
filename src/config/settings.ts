import fs from "fs";
import path from "path";

interface BotConfig {
  voiceSettings: {
    defaultUserLimit: number;
    defaultPrefix: string;
    maxChannelsPerUser: number;
    deleteEmptyAfterSeconds: number;
  };
  permissions: {
    defaultOwnerPerms: string[];
    defaultMemberPerms: string[];
  };
  developers: string[];
}

// Configuração padrão
const defaultConfig: BotConfig = {
  voiceSettings: {
    defaultUserLimit: 99,
    defaultPrefix: "🚀",
    maxChannelsPerUser: 1,
    deleteEmptyAfterSeconds: 30,
  },
  permissions: {
    defaultOwnerPerms: ["ManageChannels", "MoveMembers", "MuteMembers", "DeafenMembers", "ViewChannel", "Connect", "Speak", "Stream", "UseVAD"],
    defaultMemberPerms: ["ViewChannel", "Connect", "Speak", "Stream", "UseVAD"],
  },
  developers: [],
};

// Caminho para o arquivo de configuração
const configPath = path.join(process.cwd(), "config.json");

// Carrega ou cria o arquivo de configuração
let config: BotConfig;

try {
  if (fs.existsSync(configPath)) {
    const fileContents = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(fileContents);
    // Mescla com os valores padrão para garantir que todas as propriedades existam
    config = {
      ...defaultConfig,
      ...config,
      voiceSettings: {
        ...defaultConfig.voiceSettings,
        ...config.voiceSettings,
      },
      permissions: {
        ...defaultConfig.permissions,
        ...config.permissions,
      },
    };
  } else {
    config = defaultConfig;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  }
} catch (error) {
  console.error("Erro ao carregar configurações:", error);
  config = defaultConfig;
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (writeError) {
    console.error("Erro ao escrever arquivo de configuração padrão:", writeError);
  }
}

export default config;
