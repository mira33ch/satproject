${msg("email.executeActions.subject")} - SatMonitor
${"="?right_pad(msg("email.executeActions.subject")?length + 12)}

${msg("email.executeActions.greeting")} ${user.firstName!'Utilisateur'},

${msg("email.executeActions.intro")} :

<#if requiredActions?seq_contains("VERIFY_EMAIL")>
- ${msg("email.executeActions.verifyEmail")}
</#if>

${msg("email.executeActions.linkPrompt")} :
${link}

${msg("email.executeActions.linkValid")}.

${msg("email.executeActions.signature")}
SatMonitor