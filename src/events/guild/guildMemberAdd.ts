import { GuildMember, Role } from "discord.js";
import prisma from "../../utils/database";
import { BotClient } from "../../structures/BotClient"; // Importar BotClient se necessário para logs ou cache

export async function handleGuildMemberAdd(member: GuildMember, client: BotClient) {
  console.log(`[GuildMemberAdd] Evento disparado para: ${member.user.tag} (${member.id}) em ${member.guild.name}`);
  if (member.user.bot) {
    console.log(`[GuildMemberAdd] Usuário é um bot. Ignorando.`);
    return;
  }

  try {
    console.log(`[GuildMemberAdd] Buscando dados da guilda ${member.guild.id} no DB...`);
    const guildData = await prisma.guild.findUnique({
      where: { id: member.guild.id },
      select: { autoRoleEnabled: true, autoRoleIDs: true },
    });
    console.log(`[GuildMemberAdd] Dados da guilda encontrados:`, guildData);

    // Se o AutoRole estiver desativado ou não houver cargos, não faz nada
    if (!guildData) {
      console.log(`[GuildMemberAdd] Configuração da guilda não encontrada no DB.`);
      return;
    }
    if (!guildData.autoRoleEnabled) {
      console.log(`[GuildMemberAdd] AutoRole está DESATIVADO para esta guilda.`);
      return;
    }
    if (guildData.autoRoleIDs.length === 0) {
      console.log(`[GuildMemberAdd] Lista de AutoRoleIDs está VAZIA.`);
      return;
    }
    console.log(`[GuildMemberAdd] AutoRole ATIVADO com ${guildData.autoRoleIDs.length} cargo(s): [${guildData.autoRoleIDs.join(", ")}]`);

    const rolesToAdd: Role[] = [];
    const rolesToAttempt: string[] = [...guildData.autoRoleIDs]; // Copia para log

    for (const roleId of rolesToAttempt) {
      console.log(`[GuildMemberAdd] Processando Role ID: ${roleId}`);
      const role = member.guild.roles.cache.get(roleId);
      if (role) {
        console.log(`[GuildMemberAdd] Cargo encontrado no cache: ${role.name} (${role.id})`);
        const botMember = member.guild.members.me;
        if (!botMember) {
          console.warn(`[GuildMemberAdd] Não foi possível encontrar o membro do bot (guild.members.me)`);
          continue;
        }
        const highestBotRolePosition = botMember.roles.highest.position;
        console.log(`[GuildMemberAdd] Posição do cargo a adicionar: ${role.position}. Posição mais alta do bot: ${highestBotRolePosition}. Gerenciado: ${role.managed}`);

        if (!role.managed && role.position < highestBotRolePosition) {
          console.log(`[GuildMemberAdd] Cargo ${role.name} é válido para adição.`);
          rolesToAdd.push(role);
        } else {
          console.warn(`[GuildMemberAdd] Cargo ${role.name} NÃO é válido (Gerenciado: ${role.managed}, Posição: ${role.position} vs Bot ${highestBotRolePosition}). Removendo do DB.`);
          // Remover cargo inválido do DB para evitar tentativas futuras
          const updatedRoles = guildData.autoRoleIDs.filter((id) => id !== roleId);
          await prisma.guild.update({
            where: { id: member.guild.id },
            data: { autoRoleIDs: { set: updatedRoles } },
          });
          // Atualiza a cópia local para consistência no loop (embora não seja estritamente necessário aqui)
          guildData.autoRoleIDs = updatedRoles;
        }
      } else {
        console.warn(`[GuildMemberAdd] Cargo com ID ${roleId} NÃO encontrado no cache. Removendo do DB.`);
        // Remover cargo inválido do DB
        const updatedRoles = guildData.autoRoleIDs.filter((id) => id !== roleId);
        await prisma.guild.update({
          where: { id: member.guild.id },
          data: { autoRoleIDs: { set: updatedRoles } },
        });
        guildData.autoRoleIDs = updatedRoles;
      }
    }

    if (rolesToAdd.length > 0) {
      console.log(`[GuildMemberAdd] Tentando adicionar ${rolesToAdd.length} cargos a ${member.user.tag}: ${rolesToAdd.map((r) => r.name).join(", ")}`);
      try {
        await member.roles.add(rolesToAdd, "AutoRole: Cargos automáticos para novo membro.");
        console.log(`[GuildMemberAdd] ✅ Cargos adicionados com sucesso a ${member.user.tag}.`);
      } catch (addError) {
        console.error(`[GuildMemberAdd] ❌ Erro ao ADICIONAR cargos a ${member.user.tag}:`, addError);
      }
    } else {
      console.log(`[GuildMemberAdd] Nenhum cargo válido encontrado para adicionar a ${member.user.tag}.`);
    }
  } catch (error) {
    console.error(`[GuildMemberAdd] ❌ Erro GERAL no handler para ${member.user.tag}:`, error);
  }
}
