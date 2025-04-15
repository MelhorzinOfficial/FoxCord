import { createLogger, format, transports } from "winston";
import fs from "fs";
import path from "path";

// Cria o diretório de logs se não existir
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configuração do logger
const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.errors({ stack: true }), format.splat(), format.json()),
  defaultMeta: { service: "foxcord" },
  transports: [
    // Escreve em arquivo para todos os logs
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
});

// Se não estamos em produção, também loga para o console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
    })
  );
}

export default logger;
