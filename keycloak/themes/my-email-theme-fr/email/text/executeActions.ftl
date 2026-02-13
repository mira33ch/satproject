Action requise - SatMonitor
===========================

Bonjour ${user.firstName!'Cher utilisateur'},

Vous avez demandé les actions suivantes pour votre compte :

<#if requiredActions?seq_contains("VERIFY_EMAIL")>
- Vérification d'adresse email
</#if>
<#if requiredActions?seq_contains("UPDATE_PASSWORD")>
- Mise à jour du mot de passe
</#if>
<#if requiredActions?seq_contains("CONFIGURE_TOTP")>
- Configuration de l'authentification à deux facteurs
</#if>

Pour compléter ces actions, veuillez cliquer sur le lien ci-dessous :
${link}

Ce lien est valable pour les 24 prochaines heures.

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

L'équipe SatMonitor