import * as ping from "./info/ping";
import * as limite from "./voice/limit";
import * as renomear from "./voice/rename";
import * as transferir from "./voice/transfer";
import * as info from "./voice/info";
import * as kick from "./voice/kick";
import * as lock from "./voice/lock";
import * as setupVoice from "./admin/setupVoice";

export const commands = {
  ping,
  limite,
  renomear,
  transferir,
  info,
  kick,
  lock,
  setupvoice: setupVoice,
};
